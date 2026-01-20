import type { ElysiaInstance } from "elysia"
import { Entry, Hooks, MessageContext, MessageFallbackHandler, MessageHandler } from "../types"

/**
 * PatternMatcher supports:
 * - Exact/wildcard/greedy match
 * - Fallback/catchall
 * - Global + per-handler hooks (onBefore/onAfter)
 * - Async execution with resolveAndRun convenience
 */
export class PatternMatcher<Instance extends ElysiaInstance = ElysiaInstance> {
    private registry = new Map<string, Entry<MessageHandler<any, any, Instance>>>()
    private fallback: MessageFallbackHandler<Instance> | null = null
    public hooks: Hooks<Instance> = {}
    public onError?: (err: unknown, ctx?: MessageContext<any, Instance>) => void | Promise<void>

    /** Register a handler for a pattern */
    on(pattern: string, handler: MessageHandler<any, any, Instance>, hooks?: Hooks) {
        const entry: Entry<MessageHandler<any, any, Instance>> = {
            pattern,
            handler,
            regex: this.compile(pattern),
            score: this.score(pattern),
            hooks
        }

        this.registry.set(pattern, entry)
    }

    /** Register a fallback/catchall handler */
    onFallback(handler: MessageFallbackHandler<Instance>) {
        this.fallback = handler
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
        const exact = this.registry.get(pattern)
        if (exact) return { handler: this.wrapWithHooks(exact), matchedPattern: pattern }

        // Wildcard / greedy match
        let best: Entry<MessageHandler<any, any, Instance>> | null = null
        for (const entry of this.registry.values()) {
            if (!entry.regex) continue
            if (!entry.regex.test(pattern)) continue
            if (!best || entry.score > best.score) best = entry
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
            if (this.onError) await this.onError(err, messageCtx)
            else throw err
        }
    }

    /** Wrap a handler to include hooks */
    private wrapWithHooks(entry: Entry<MessageHandler<any, any, Instance>>): MessageHandler<any, any, Instance> {
        return async (ctx: MessageContext<any, Instance>) => {
            try {
                const fullCtx = { ...ctx, ...ctx.store }

                // Global + per-handler before hooks
                const beforeHooks = [...(this.hooks.onBefore || []), ...(entry.hooks?.onBefore || [])]
                for (const hook of beforeHooks) await hook(fullCtx)

                const response = await entry.handler(fullCtx)

                // Global + per-handler after hooks
                const afterHooks = [...(this.hooks.onAfter || []), ...(entry.hooks?.onAfter || [])]
                for (const hook of afterHooks) await hook(ctx, response)

                return response
            } catch (err) {
                if (this.onError) await this.onError(err, ctx)
                else throw err
            }
        }
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
            if (this.onError) await this.onError(err, fallbackCtx)
            else throw err
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