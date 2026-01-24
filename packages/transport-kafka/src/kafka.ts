import { Kafka } from "kafkajs";
import { KafkaTransportOptions } from "./types";

export async function createKafkaTransport(
  registry: any,
  options: KafkaTransportOptions
) {
  const kafka = new Kafka({ brokers: options.brokers });
  const consumer = kafka.consumer({ groupId: options.groupId ?? "elysia-ms" });

  await consumer.connect();

  const eventPatterns = registry.getEventPatterns()
  for (const pattern of eventPatterns) {
    await consumer.subscribe({ topic: pattern });
  }

  await consumer.run({
    eachMessage: async ({
      topic,
      message,
    }: {
      topic: string;
      message: any;
    }) => {
      try {
        const { data, meta } = JSON.parse(message.value!.toString());
        await registry.resolveAndRunEvent(topic, data, { meta });
      } catch (e: any) {
        console.warn(`[Kafka Transport] Error handling event:`, e.message);
      }
    },
  });

  return {
    close: async () => consumer.disconnect(),
  };
}
