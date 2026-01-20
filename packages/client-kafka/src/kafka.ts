import { Kafka } from "kafkajs";
import { KafkaClientOptions } from "./types";

export async function createKafkaClient(options: KafkaClientOptions) {
  const kafka = new Kafka(options);
  const producer = kafka.producer();

  await producer.connect();

  return {
    async send() {
      throw new Error("Kafka does not support request/response safely");
    },

    async emit(topic: string, data: any) {
      await producer.send({
        topic,
        messages: [{ value: JSON.stringify(data) }],
      });
    },

    async close() {
      await producer.disconnect();
    },
  };
}
