import dns from "dns/promises";
import type { DiscoveryProvider, ServiceEndpoint } from "./types";

export class DnsDiscovery implements DiscoveryProvider {
  constructor(private hostname: string, private port: number) {}

  async resolve(): Promise<ServiceEndpoint[]> {
    const records = await dns.lookup(this.hostname, { all: true });
    return records.map((r) => ({
      host: r.address,
      port: this.port,
    }));
  }
}
