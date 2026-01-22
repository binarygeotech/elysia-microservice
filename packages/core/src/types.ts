import type { ElysiaInstance } from "elysia";

export type TransportType = "tcp" | "tls" | "redis" | "nats" | "kafka";

export interface BaseTransportOptions {
  port?: number;
  host?: string;
}

export interface TcpTransportOptions extends BaseTransportOptions {}

export interface TlsTransportOptions extends BaseTransportOptions {
  key: string | Buffer;
  cert: string | Buffer;
  ca?: string | Buffer;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
}

export interface RedisTransportOptions {
  url?: string;
  username?: string;
  password?: string;
  db?: number;
  tls?: boolean;
}

export interface NatsTransportOptions {
  url?: string;
  servers?: string[];
  user?: string;
  pass?: string;
  token?: string;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}

export interface KafkaTransportOptions {
  brokers: string[];
  groupId?: string;
  clientId?: string;
}

export type TransportOptions =
  | TcpTransportOptions
  | TlsTransportOptions
  | RedisTransportOptions
  | NatsTransportOptions
  | KafkaTransportOptions;

export interface MicroserviceHybridOptions extends BaseTransportOptions {}

export interface ServiceEndpoint {
  host?: string;
  port?: number;
  url?: string;
}

export interface MicroserviceTransportOption {
  transport: TransportType;
  options?: TransportOptions;
}

export interface MicroserviceClientOption extends MicroserviceTransportOption {
  resilience?: {
    retries: number;
    timeout: number;
    breakerThreshold: number;
  };
  discovery?: {
    strategy: string;
    endpoints: ServiceEndpoint[];
  };
  loadBalancer?: string;
  chaos?: {
    failRate?: number;
    latencyMs?: number;
  };
}

export interface MicroserviceConfig {
  server?: MicroserviceTransportOption;
  clients?: Record<string, MicroserviceClientOption>;
  hybrid?: boolean;
}

export type MaybePromise<T> = T | Promise<T>

export interface TypedMessageRoute<Input = unknown, Response = unknown> {
  input?: Input
  response?: Response
}

/** 
 * MessageContext is fully Elysia-aware (store, plugins, decorators) 
 * but does NOT include the HTTP request object.
 */
export interface MessageContext<Input = unknown, Instance extends ElysiaInstance = ElysiaInstance> {
  /** The matched pattern, or fallback pattern */
  pattern: string

  /** Incoming message payload */
  data: Input

  /** Transport/runtime metadata */
  meta?: unknown

  /** Access to Elysia store and plugins */
  store: Instance['store']
}

/** Microservice handler for a registered message pattern */
export type MessageHandler<
  Input = unknown,
  Response = unknown,
  Instance extends ElysiaInstance = ElysiaInstance
> = (ctx: MessageContext<Input, Instance>) => MaybePromise<Response>

/** Microservice Handler for unmatched (catchall) messages */
export type MessageFallbackHandler<Instance extends ElysiaInstance = ElysiaInstance> =
  (ctx: MessageContext<unknown, Instance> & { incoming: string }) => MaybePromise<unknown>

/** Microservice handler lifecycle hooks */
export interface Hooks<Instance extends ElysiaInstance = ElysiaInstance> {
  /** Called before a handler runs */
  onBefore?: ((ctx: { pattern: string; data: unknown; store: Instance['store']; meta?: unknown }) => void | Promise<void>)[]
  /** Called after a handler runs */
  onAfter?: ((ctx: { pattern: string; data: unknown; store: Instance['store']; meta?: unknown }, response: unknown) => void | Promise<void>)[]
}

/** Microservice handler entry */
export interface Entry<HandlerType = any> {
  pattern: string
  handler: HandlerType
  regex?: RegExp
  score: number
  hooks?: Hooks<ElysiaInstance>
}