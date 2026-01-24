import type { ElysiaInstance } from "elysia"
import { Entry, Hooks, MessageContext, MessageFallbackHandler, MessageHandler, GuardFunction, Middleware, GroupBuilder } from "../types"

/**
 * PatternMatcher supports:
 * - Exact/wildcard/greedy match
 * - Fallback/catchall
 * - Global + per-handler hooks (onBefore/onAfter)
 * - Global + group + handler guards and middleware
 * - Async execution with resolveAndRun convenience
 */
export class PatternMatcher<Instance extends ElysiaInstance = ElysiaInstance> {
    private registry = new Map<string, Entry<MessageHandler<any, any, any>, any>>()
    private fallback: MessageFallbackHandler<Instance> | null = null
    public hooks: Hooks<Instance> = {}
    public onError?: (err: unknown, ctx?: MessageContext<any, Instance>) => void | Promise<void>
    
    // Global guards and middleware
    private globalGuards: GuardFunction<Instance>[] = []
    private globalMiddleware: Middleware<Instance>[] = []
    
    // Group-scoped guards and middleware
    private groups = new Map<string, GroupBuilder<Instance>>()

    /** Register a handler for a pattern */
    on(pattern: string, handler: MessageHandler<any, any, Instance>, hooks?: Hooks) {
        const entry: Entry<MessageHandler<any, any, Instance>, Instance> = {
            pattern,
            handler,
            regex: this.compile(pattern),
            score: this.score(pattern),
            hooks,
            middleware: []
        }

        this.registry.set(pattern, entry)
    }

    /** Register a fallback/catchall handler */
    onFallback(handler: MessageFallbackHandler<Instance>) {
        this.fallback = handler
    }

    /** Add a global guard */
    addGlobalGuard(guard: GuardFunction<Instance>) {
        this.globalGuards.push(guard)
    }

    /** Add global middleware */
    addGlobalMiddleware(middleware: Middleware<Instance>) {
        this.globalMiddleware.push(middleware)
    }

    /** Create or get a group for scoped middleware/guards */
    createGroup(prefix: string): GroupBuilder<Instance> {
        if (this.groups.has(prefix)) {
            return this.groups.get(prefix)!
        }

        const group: GroupBuilder<Instance> = {
            prefix,
            guards: [],
            middleware: [],
            msGuard: function (guard: GuardFunction<Instance>) {
                this.guards.push(guard)
                return this
            },
            msMiddleware: function (middleware: Middleware<Instance>) {
                this.middleware.push(middleware)
                return this
            }
        }

        this.groups.set(prefix, group)
        return group
    }

    /** Set handler-level middleware */
    setHandlerMiddleware(pattern: string, middleware: Middleware<Instance>[]) {
        const entry = this.registry.get(pattern)
        if (entry) {
            entry.middleware = middleware
        }
    }

    /** Get all registered patterns */
    getPatterns(): string[] {
        return Array.from(this.registry.keys())
    }

    /**
     * Resolve the best handler for a given pattern
     */
    resolve(pattern: string): { handler: MessageHandler<any, any, Instance> | null; matchedPattern: string | null } {
        // Exact match
        const exact = this.registry.get(pattern) as Entry<MessageHandler<any, any, Instance>, Instance> | undefined
        if (exact) return { handler: this.wrapWithHooks(exact), matchedPattern: pattern }

        // Wildcard / greedy match
        let best: Entry<MessageHandler<any, any, Instance>, Instance> | null = null
        for (const entry of this.registry.values()) {
            if (!entry.regex) continue
            if (!entry.regex.test(pattern)) continue
            if (!best || entry.score > best.score) best = entry as Entry<MessageHandler<any, any, Instance>, Instance>
        }

        if (best) return { handler: this.wrapWithHooks(best), matchedPattern: best.pattern }

        // Fallback
        if (this.fallback) {
            const handler: MessageHandler<any, any, Instance> = (ctx) =>
                this.runFallback(pattern, ctx.data, ctx.meta, ctx)
            return { handler, matchedPattern: null }
        }

        return { handler: null, matchedPattern: null }
    }

    /**
     * Resolve and immediately run the handler with hooks
     * @param pattern The incoming message pattern
     * @param data The incoming payload
     * @param ctx Optional context (store/meta)
     */
    async resolveAndRun(pattern: string, data: unknown, ctx?: Partial<MessageContext<any, Instance>>) {
        const { handler } = this.resolve(pattern)
        if (!handler) throw new Error(`No handler found for pattern "${pattern}"`)

        const messageCtx: MessageContext<any, Instance> = {
            pattern,
            data,
            meta: ctx?.meta,
            store: ctx?.store ?? {} as Instance['store']
        }

        try {
            return await handler(messageCtx)
        } catch (err) {
            if (this.onError) {
                await this.onError(err, messageCtx)
            }
            // Always rethrow so transport can handle
            throw err
        }
    }

    /** Wrap a handler to include guards, middleware, and hooks */
    private wrapWithHooks(entry: Entry<MessageHandler<any, any, Instance>, Instance>): MessageHandler<any, any, Instance> {
        return async (ctx: MessageContext<any, Instance>) => {
            const fullCtx = { ...ctx, ...ctx.store }

            try {
                // GUARDS PHASE: Global → Group → Handler
                // Any guard can block (throw)
                
                // 1. Global guards
                for (const guard of this.globalGuards) {
                    await guard(ctx)
                }

                // 2. Group guards (if pattern matches any group prefix)
                for (const [prefix, group] of this.groups) {
                    if (this.matchesGroupPrefix(ctx.pattern, prefix)) {
                        for (const guard of group.guards) {
                            await guard(ctx)
                        }
                    }
                }

                // 3. Handler-level guards (not yet implemented, reserved)
                // await entry.guards?.(...) if we add handler-level guards

                // MIDDLEWARE.ONBEFORE PHASE: Global → Group → Handler
                // Each middleware can enrich context or block (throw)

                // 1. Global middleware onBefore
                for (const mw of this.globalMiddleware) {
                    if (mw.onBefore) {
                        const enrichment = await mw.onBefore(ctx)
                        if (enrichment && typeof enrichment === 'object') {
                            Object.assign(ctx, enrichment)
                            Object.assign(fullCtx, enrichment)
                        }
                    }
                }

                // 2. Group middleware onBefore
                for (const [prefix, group] of this.groups) {
                    if (this.matchesGroupPrefix(ctx.pattern, prefix)) {
                        for (const mw of group.middleware) {
                            if (mw.onBefore) {
                                const enrichment = await mw.onBefore(ctx)
                                if (enrichment && typeof enrichment === 'object') {
                                    Object.assign(ctx, enrichment)
                                    Object.assign(fullCtx, enrichment)
                                }
                            }
                        }
                    }
                }

                // 3. Handler-level middleware onBefore
                if (entry.middleware) {
                    for (const mw of entry.middleware) {
                        if (mw.onBefore) {
                            const enrichment = await mw.onBefore(ctx)
                            if (enrichment && typeof enrichment === 'object') {
                                Object.assign(ctx, enrichment)
                                Object.assign(fullCtx, enrichment)
                            }
                        }
                    }
                }

                // LEGACY HOOKS PHASE (compatibility)
                const beforeHooks = [...(this.hooks.onBefore || []), ...(entry.hooks?.onBefore || [])]
                for (const hook of beforeHooks) await hook(fullCtx)

                // HANDLER EXECUTION
                const response = await entry.handler(fullCtx)

                // MIDDLEWARE.ONAFTER PHASE: Handler → Group → Global (reverse order)
                // Always runs regardless of handler success/failure

                // 1. Handler-level middleware onAfter
                if (entry.middleware) {
                    for (const mw of entry.middleware) {
                        if (mw.onAfter) {
                            await mw.onAfter(ctx, response)
                        }
                    }
                }

                // 2. Group middleware onAfter (reverse order)
                const groupsArray = Array.from(this.groups.entries()).reverse()
                for (const [prefix, group] of groupsArray) {
                    if (this.matchesGroupPrefix(ctx.pattern, prefix)) {
                        const reverseMiddleware = [...group.middleware].reverse()
                        for (const mw of reverseMiddleware) {
                            if (mw.onAfter) {
                                await mw.onAfter(ctx, response)
                            }
                        }
                    }
                }

                // 3. Global middleware onAfter (reverse order)
                const reverseGlobalMiddleware = [...this.globalMiddleware].reverse()
                for (const mw of reverseGlobalMiddleware) {
                    if (mw.onAfter) {
                        await mw.onAfter(ctx, response)
                    }
                }

                // LEGACY HOOKS PHASE (compatibility)
                const afterHooks = [...(this.hooks.onAfter || []), ...(entry.hooks?.onAfter || [])]
                for (const hook of afterHooks) await hook(ctx, response)

                return response
            } catch (err) {
                if (this.onError) {
                    await this.onError(err, ctx)
                }
                // Always rethrow so transport can handle
                throw err
            }
        }
    }

    /** Check if a pattern matches a group prefix */
    private matchesGroupPrefix(pattern: string, prefix: string): boolean {
        if (prefix === '{any}') return true
        if (!prefix.includes('*')) {
            return pattern.startsWith(prefix)
        }
        const regex = this.globToRegex(prefix)
        return regex.test(pattern)
    }

    /** Run fallback with hooks */
    private async runFallback(pattern: string, data: unknown, meta?: unknown, ctx?: MessageContext<any, Instance>) {
        if (!this.fallback) throw new Error("No fallback registered")

        const fallbackCtx: MessageContext<any, Instance> & { incoming: string } = {
            pattern,
            data,
            meta,
            incoming: pattern,
            store: ctx?.store ?? {} as Instance['store']
        }

        try {
            const beforeHooks = this.hooks.onBefore || []
            for (const hook of beforeHooks) await hook(fallbackCtx)

            const response = await this.fallback(fallbackCtx)

            const afterHooks = this.hooks.onAfter || []
            for (const hook of afterHooks) await hook(fallbackCtx, response)

            return response
        } catch (err) {
            if (this.onError) {
                await this.onError(err, fallbackCtx)
            }
            // Always rethrow so transport can handle
            throw err
        }
    }

    /** Compile pattern to RegExp */
    private compile(pattern: string): RegExp | undefined {
        if (pattern === '{any}' || pattern === '.*') return /^.*$/
        if (pattern.startsWith('/') && pattern.lastIndexOf('/') > 0) {
            const last = pattern.lastIndexOf('/')
            const body = pattern.slice(1, last)
            const flags = pattern.slice(last + 1)
            return new RegExp(body, flags)
        }
        if (pattern.includes('*')) return this.globToRegex(pattern)
        return undefined
    }

    private globToRegex(pattern: string) {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
        return new RegExp(`^${escaped}$`)
    }

    private score(pattern: string) {
        if (pattern === '{any}' || pattern === '.*') return 0
        return pattern.replace(/\*/g, '').length
    }
}