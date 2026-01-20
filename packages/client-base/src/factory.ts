import type { BaseClientConfig } from "./types";

export async function createClient(config: BaseClientConfig) {
  switch (config.transport) {
    case "tcp": {
      const { createTcpClient } = await import("@elysia-microservice/client-tcp");
      return createTcpClient(config.options);
    }
    case "tls": {
      const { createTlsClient } = await import("@elysia-microservice/client-tls");
      return createTlsClient(config.options);
    }
    case "redis": {
      const { createRedisClient } = await import("@elysia-microservice/client-redis");
      return await createRedisClient(config.options);
    }
    case "nats": {
      const { createNatsClient } = await import("@elysia-microservice/client-nats");
      return await createNatsClient(config.options);
    }
    case "kafka": {
      const { createKafkaClient } = await import("@elysia-microservice/client-kafka");
      return await createKafkaClient(config.options);
    }
    default:
      throw new Error(`Unsupported client transport: ${config.transport}`);
  }
}
