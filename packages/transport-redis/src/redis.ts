import { createClient } from "redis";
import { RedisTransportOptions } from "./types";

export async function createRedisTransport(
  registry: any,
  options: RedisTransportOptions = {}
): Promise<{ sub: any; pub: any }> {
  const sub = createClient(options);
  const pub = createClient(options);

  await sub.connect();
  await pub.connect();

  // Subscribe to all registered request patterns
  const requestPatterns = registry.getRequestPatterns()
  for (const pattern of requestPatterns) {
    sub.subscribe(pattern, async (message, channel) => {
      try {
        const { id, data } = JSON.parse(message);
        const result = await registry.resolveAndRunRequest(channel || pattern, data);
        await pub.publish(`${channel || pattern}:res:${id}`, JSON.stringify(result));
      } catch (e: any) {
        console.warn(`[Redis Transport] Error handling request:`, e.message);
        const { id } = JSON.parse(message);
        await pub.publish(`${channel || pattern}:res:${id}`, JSON.stringify({ error: e.message }));
      }
    });
  }

  // Subscribe to all registered event patterns
  const eventPatterns = registry.getEventPatterns()
  for (const pattern of eventPatterns) {
    sub.subscribe(pattern, async (message, channel) => {
      try {
        const data = JSON.parse(message);
        await registry.resolveAndRunEvent(channel || pattern, data);
      } catch (e: any) {
        console.warn(`[Redis Transport] Error handling event:`, e.message);
      }
    });
  }

  console.log(`Redis microservice connected to ${options.url ?? "redis://localhost:6379"}`)

  return { sub, pub };
}
