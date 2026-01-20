import { connect } from "nats";
import { randomUUID } from "crypto";
import { NatsClientOptions } from "./types";

export async function createNatsClient(options: NatsClientOptions = {}) {
  const nc = await connect({ ...options });

  return {
    async send(pattern: string, data: any) {
      const id = randomUUID();
      const inbox = `_INBOX.${id}`;
      const sub = nc.subscribe(inbox);

      nc.publish(pattern, JSON.stringify({ id, data }), { reply: inbox });

      for await (const msg of sub) {
        sub.unsubscribe();
        return JSON.parse(msg.data.toString());
      }
    },

    async emit(pattern: string, data: any) {
      nc.publish(pattern, JSON.stringify(data));
    },

    async close() {
      await nc.close();
    },
  };
}
