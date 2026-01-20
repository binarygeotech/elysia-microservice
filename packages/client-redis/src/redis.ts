import { createClient } from "redis";
import { randomUUID } from "crypto";
import { RedisClientOptions } from "./types";

export async function createRedisClient(options: RedisClientOptions = {}) {
  const pub = createClient(options);
  const sub = createClient(options);

  await pub.connect();
  await sub.connect();

  return {
    async send(pattern: string, data: any) {
      const id = randomUUID();
      const responseChannel = `${pattern}:res:${id}`;

      return new Promise(async (resolve) => {
        await sub.subscribe(responseChannel, (msg) => {
          sub.unsubscribe(responseChannel);
          resolve(JSON.parse(msg));
        });
        await pub.publish(pattern, JSON.stringify({ id, data }));
      });
    },

    async emit(pattern: string, data: any) {
      await pub.publish(pattern, JSON.stringify(data));
    },

    async close() {
      await pub.quit();
      await sub.quit();
    },
  };
}
