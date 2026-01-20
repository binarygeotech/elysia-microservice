export function withChaos<T extends object>(
  client: T,
  chaos?: { failRate?: number; latencyMs?: number }
): T {
  if (!chaos) return client;

  return new Proxy(client, {
    async get(target, prop) {
      const fn = (target as any)[prop];
      if (typeof fn !== "function") return fn;

      return async (...args: any[]) => {
        if (chaos.failRate && Math.random() < chaos.failRate) {
          throw new Error("Injected failure");
        }
        if (chaos.latencyMs) {
          await new Promise((r) => setTimeout(r, chaos.latencyMs));
        }
        return fn(...args);
      };
    },
  });
}
