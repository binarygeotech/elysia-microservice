// import { createRegistry } from "./registry";
import { createRegistry } from "./patterns/registry";
import { enableGracefulShutdown } from "./shutdown";
import type { Hooks, MicroserviceConfig, MessageContext, TcpTransportOptions, TlsTransportOptions, RedisTransportOptions, NatsTransportOptions, KafkaTransportOptions, GuardFunction, Middleware, GroupBuilder } from "./types";
import type { ElysiaInstance } from "elysia";

// Type augmentation for Elysia decorators
declare module "elysia" {
  interface Elysia {
    microservice: {
      registry: ReturnType<typeof createRegistry>;
      server: any;
      clients: Record<string, any>;
      start: () => Promise<Elysia<ElysiaInstance> | undefined | void>;
      stop: () => Promise<Elysia<ElysiaInstance> | undefined | void>;
      awaitReady: () => Promise<void>;

      health: () => boolean;
      ready: () => boolean;
    };

    /**
     * 
     * @param pattern string
     * @param handler MessageHandler<ElysiaInstance>
     * @param hooks Hooks
     */
    onMsMessage(pattern: string, handler: (ctx?: MessageContext<any, ElysiaInstance>) => any, hooks?: Hooks): this;

    /**
     * 
     * @param pattern string
     * @param handler MessageHandler<ElysiaInstance>
     * @param hooks Hooks
     */
    onMsEvent(pattern: string, handler: (ctx?: MessageContext<any, ElysiaInstance>) => void, hooks?: Hooks): this;
    onMsCatchallMessage(handler: (pattern: string, ctx?: MessageContext<any, ElysiaInstance>) => any): this;
    onMsCatchallEvent(handler: (pattern: string, ctx?: MessageContext<any, ElysiaInstance>) => void): this;

    onMsError(handler: (err: unknown, ctx?: MessageContext<any, ElysiaInstance>) => void | Promise<void>): this;
    
    /** Add a global message guard */
    msGuard(guard: GuardFunction<ElysiaInstance>): this;
    
    /** Add a global message middleware */
    msMiddleware(middleware: Middleware<ElysiaInstance> | Hooks): this;
    
    /** Create a scoped message group with prefix-based guards/middleware */
    msGroup(prefix: string): GroupBuilder<ElysiaInstance>;
  }
}

/**
 * Elysia Microservice Plugin
 * 
 * This plugin enables microservice functionality in Elysia applications.
 * It can be used in two modes:
 * 
 * 1. Plugin Mode (Hybrid): Run microservice alongside HTTP server
 * 2. Standalone Mode: Run microservice only (no HTTP server)
 * 
 * @example Hybrid Mode
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { Microservice } from '@elysia-microservice/core';
 * 
 * const app = new Elysia()
 *   .use(Microservice({ 
 *     server: { transport: 'tcp', options: { port: 4000 } },
 *     hybrid: true 
 *   }))
 *   .onMsMessage('get.user', async (data) => ({ id: data.id, name: 'John' }))
 *   .get('/', () => 'HTTP + Microservice')
 *   .listen(3000);
 * ```
 * 
 * @example Microservice Mode
 * ```typescript
 * import { Elysia } from 'elysia';
 * import { Microservice } from '@elysia-microservice/core';
 * 
 * const app = new Elysia()
 *   .use(Microservice({ 
 *     server: { transport: 'tcp', options: { port: 4000 } } 
 *   }))
 *   .onMsMessage('get.user', async (data) => ({ id: data.id, name: 'John' }));
 * 
 * await app.microservice.start();
 * await app.microservice.awaitReady();
 * ```
 */
export function Microservice(config: MicroserviceConfig) {
  return (app: any): ElysiaInstance => {
    const registry = createRegistry();

    let server: any;
    let started = false;
    let healthy = true;
    let ready = false;

    let readyResolve!: () => void;
    let readyReject!: (e: any) => void;
    const readyPromise = new Promise<void>((res, rej) => {
      readyResolve = res;
      readyReject = rej;
    });

    async function startMicroservice() {
      if (started) return readyPromise;
      started = true;

      try {
        // Start server transport
        if (config.server) {
          switch (config.server.transport) {
            case "tcp": {
              // @ts-ignore - Dynamic import resolved at runtime
              const { createTcpTransport } = await import("@elysia-microservice/transport-tcp");
              server = createTcpTransport(registry, config.server.options as TcpTransportOptions);
              break;
            }
            case "tls": {
              // @ts-ignore - Dynamic import resolved at runtime
              const { createTlsTransport } = await import("@elysia-microservice/transport-tls");
              server = createTlsTransport(registry, config.server.options as TlsTransportOptions);
              break;
            }
            case "redis": {
              // @ts-ignore - Dynamic import resolved at runtime
              const { createRedisTransport } = await import("@elysia-microservice/transport-redis");
              server = await createRedisTransport(registry, config.server.options as RedisTransportOptions);
              break;
            }
            case "nats": {
              // @ts-ignore - Dynamic import resolved at runtime
              const { createNatsTransport } = await import("@elysia-microservice/transport-nats");
              server = await createNatsTransport(registry, config.server.options as NatsTransportOptions);
              break;
            }
            case "kafka": {
              // @ts-ignore - Dynamic import resolved at runtime
              const { createKafkaTransport } = await import("@elysia-microservice/transport-kafka");
              server = await createKafkaTransport(registry, config.server.options as KafkaTransportOptions);
              break;
            }
            default:
              throw new Error(`Unsupported transport: ${config.server.transport}`);
          }
        }

        // Start clients
        if (config.clients) {
          // @ts-ignore - Dynamic import resolved at runtime
          const { createClient, withResilience } = await import("@elysia-microservice/client-base");
          // @ts-ignore - Dynamic import resolved at runtime
          const { StaticDiscovery, RoundRobinBalancer, createClientPool, withChaos } = await import("@elysia-microservice/utils");

          for (const [name, cfg] of Object.entries(config.clients)) {
            if (cfg.discovery) {
              const discovery = new StaticDiscovery(cfg.discovery.endpoints);
              const balancer = new RoundRobinBalancer();

              registry.registerClient(
                name,
                createClientPool(discovery, balancer, cfg, createClient)
              );
            } else {
              let client = await createClient(cfg as any);

              client = cfg.resilience
                ? withResilience(client, cfg.resilience)
                : client;
              client = cfg.chaos ? withChaos(client, cfg.chaos) : client;

              registry.registerClient(name, client);
            }
          }
        }

        // Initialize adapters
        if (config.adapters && config.adapters.length > 0) {
          for (const adapterConfig of config.adapters) {
            const adapter = new adapterConfig.class();
            if (adapterConfig.initializer) {
              await adapterConfig.initializer(adapter, registry);
            } else {
              await adapter.init(registry);
            }
          }
        }

        ready = true;
        readyResolve();
      } catch (e) {
        readyReject(e);
        throw e;
      }

      return readyPromise;
    }

    async function stopMicroservice() {
      healthy = false;

      if (server?.close) await server.close();
      if (server?.disconnect) await server.disconnect();

      for (const [, client] of registry.clients) {
        if (client?.close) await client.close();
      }
    }

    // Graceful shutdown
    enableGracefulShutdown(stopMicroservice);

    // HTTP health probes (HYBRID mode)
    if (config.hybrid) {
      app.get("/health", () => ({
        status: healthy ? "ok" : "down",
      }));

      app.get("/ready", () => ({
        ready,
      }));
    }

    // Explicit API (MICROSERVICE-ONLY MODE)
    app.microservice = {
      registry,
      get server() {
        return server;
      },
      get clients() {
        return Object.fromEntries(registry.clients);
      },
      async clientProxy(name: string, schema: any) {
        // @ts-ignore - Dynamic import resolved at runtime
        const { createClientProxy } = await import("@elysia-microservice/client-base");
        return createClientProxy(registry.clients.get(name), schema);
      },
      start: startMicroservice,
      stop: stopMicroservice,
      awaitReady: () => readyPromise,
      health: () => healthy,
      ready: () => ready,
    };

    // Elysia lifecycle (HYBRID MODE)
    app.onStart(startMicroservice);
    app.onStop(stopMicroservice);

    // Add chainable methods
    app.onMsMessage = function (pattern: string, handler: any, hooks?: Hooks) {
      registry.registerMessage(pattern, handler, hooks);
      return this;
    };

    app.onMsEvent = function (pattern: string, handler: any, hooks?: Hooks) {
      registry.registerEvent(pattern, handler, hooks);
      return this;
    };

    app.onMsError = function (handler: (error: unknown, context?: ElysiaInstance) => void | Promise<void>) {
      registry.setRequestErrorHandler(handler as any);
      return this;
    };

    app.msGuard = function (guard: GuardFunction<ElysiaInstance>) {
      registry.msGuard(guard, 'request');
      return this;
    };

    app.msMiddleware = function (middleware: Middleware<ElysiaInstance> | Hooks) {
      // Support both Middleware and legacy Hooks
      if ('onBefore' in middleware || 'onAfter' in middleware) {
        // Check if it's Middleware (has onBefore/onAfter as functions)
        if (typeof (middleware as any).onBefore === 'function' || typeof (middleware as any).onAfter === 'function') {
          registry.msMiddleware(middleware as Middleware<ElysiaInstance>, 'request');
        } else {
          // Legacy Hooks format
          registry.setRequestHooks(middleware as Hooks);
        }
      } else {
        registry.setRequestHooks(middleware as Hooks);
      }
      return this;
    };

    app.msGroup = function (prefix: string) {
      return registry.msGroup(prefix, 'request');
    };

    // Add catchall methods
    app.onMsCatchallMessage = function (handler: any) {
      registry.registerCatchallMessage(handler);
      return this;
    };

    app.onMsCatchallEvent = function (handler: any) {
      registry.registerCatchallEvent(handler);
      return this;
    };

    return app;
  };
}
