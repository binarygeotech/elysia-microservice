export interface NatsClientOptions {
  url?: string;
  servers?: string[];
  user?: string;
  pass?: string;
  token?: string;
  reconnect?: boolean;
  maxReconnectAttempts?: number;
}
