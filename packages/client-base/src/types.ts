export interface MicroserviceClient {
  send<T = any, R = any>(pattern: string, data: T): Promise<R>;
  emit<T = any>(pattern: string, data: T): Promise<void>;
  close(): Promise<void>;
}

export type ClientTransport = "tcp" | "tls" | "redis" | "nats" | "kafka";

export interface BaseClientConfig {
  transport: ClientTransport;
  options: any;
}
