export interface KafkaTransportOptions {
  brokers: string[];
  groupId?: string;
  clientId?: string;
}
