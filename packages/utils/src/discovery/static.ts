import type { DiscoveryProvider, ServiceEndpoint } from "./types";

export class StaticDiscovery implements DiscoveryProvider {
  constructor(private endpoints: ServiceEndpoint[]) {}

  async resolve(): Promise<ServiceEndpoint[]> {
    return this.endpoints;
  }
}
