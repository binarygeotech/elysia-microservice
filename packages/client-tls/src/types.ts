export interface TlsClientOptions {
  port?: number;
  host?: string;
  key: string | Buffer;
  cert: string | Buffer;
  ca?: string | Buffer;
  rejectUnauthorized?: boolean;
}
