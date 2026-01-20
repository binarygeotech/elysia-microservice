export interface ServiceEndpoint {
  host?: string;
  port?: number;
  url?: string;
}

export interface DiscoveryProvider {
  resolve(): Promise<ServiceEndpoint[]>;
}
