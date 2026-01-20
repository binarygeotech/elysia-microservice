export interface TlsTransportOptions {
  port?: number;
  host?: string;
  key: string | Buffer;
  cert: string | Buffer;
  ca?: string | Buffer;
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
}
