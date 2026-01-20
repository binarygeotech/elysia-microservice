export interface MicroserviceContext {
  traceId: string;
  auth?: {
    userId?: string;
    token?: string;
  };
  metadata?: Record<string, any>;
}
