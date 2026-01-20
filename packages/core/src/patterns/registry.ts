import type { ElysiaInstance, Handler } from "elysia"
import { PatternMatcher } from "./matcher"
import { Hooks, MessageContext, MessageFallbackHandler, MessageHandler } from "../types"

/** Registry for requests/events/clients */
export function createRegistry() {
    const requests = new PatternMatcher<ElysiaInstance>()
    const events = new PatternMatcher<ElysiaInstance>()
    const clients = new Map<string, any>()

    return {
        registerMessage: (pattern: string, handler: MessageHandler<any, any, ElysiaInstance>, hooks?: Hooks) =>
            requests.on(pattern, handler, hooks),

        registerEvent: (pattern: string, handler: MessageHandler<any, any, ElysiaInstance>, hooks?: Hooks) =>
            events.on(pattern, handler, hooks),

        registerCatchallMessage: (handler: MessageFallbackHandler<ElysiaInstance>) =>
            requests.onFallback(handler),

        registerCatchallEvent: (handler: MessageFallbackHandler<ElysiaInstance>) =>
            events.onFallback(handler),

        getRequestHandler: (pattern: string) => requests.resolve(pattern),
        getEventHandler: (pattern: string) => events.resolve(pattern),

        resolveAndRunRequest: (pattern: string, data: unknown, ctx?: Partial<MessageContext<any, ElysiaInstance>>) =>
            requests.resolveAndRun(pattern, data, ctx),

        resolveAndRunEvent: (pattern: string, data: unknown, ctx?: Partial<MessageContext<any, ElysiaInstance>>) =>
            events.resolveAndRun(pattern, data, ctx),

        /** Get all registered patterns */
        getRequestPatterns: () => requests.getPatterns(),
        getEventPatterns: () => events.getPatterns(),

        /** Optional global hooks for requests/events */
        setRequestHooks: (hooks: Hooks<ElysiaInstance>) => (requests.hooks = hooks),
        setEventHooks: (hooks: Hooks<ElysiaInstance>) => (events.hooks = hooks),

        /** Optional error hooks */
        setRequestErrorHandler: (fn: (err: unknown, ctx?: MessageContext<any, ElysiaInstance>) => void | Promise<void>) =>
            (requests.onError = fn),
        setEventErrorHandler: (fn: (err: unknown, ctx?: MessageContext<any, ElysiaInstance>) => void | Promise<void>) =>
            (events.onError = fn),

        registerClient: (name: string, client: any) => clients.set(name, client),

        clients
    }
}
