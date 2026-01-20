import type { DiscoveryProvider } from "./discovery/types";
import type { LoadBalancer } from "./loadbalancer/types";

export function createClientPool(
  discovery: DiscoveryProvider,
  balancer: LoadBalancer,
  baseConfig: any,
  createClientFn: (config: any) => Promise<any>
) {
  let clients = new Map<string, any>();

  async function getClient() {
    const endpoints = await discovery.resolve();
    const endpoint = balancer.next(endpoints);
    const key = JSON.stringify(endpoint);

    if (!clients.has(key)) {
      clients.set(
        key,
        await createClientFn({
          ...baseConfig,
          options: endpoint,
        })
      );
    }

    return clients.get(key);
  }

  return {
    async send(pattern: string, data: any) {
      const endpoints = await discovery.resolve();
      const endpoint = balancer.next(endpoints);
      try {
        const client = await getClient();
        return await client.send(pattern, data);
      } catch (e) {
        balancer.reportFailure(endpoint);
        throw e;
      }
    },

    async emit(pattern: string, data: any) {
      const client = await getClient();
      await client.emit(pattern, data);
    },

    async close() {
      for (const c of clients.values()) {
        await c.close();
      }
    },
  };
}
