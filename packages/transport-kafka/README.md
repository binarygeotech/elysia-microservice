# @elysia-microservice/transport-kafka

Kafka transport server for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/transport-kafka kafkajs
```

## Usage

```typescript
import { createKafkaTransport } from '@elysia-microservice/transport-kafka';
import { createRegistry } from '@elysia-microservice/core';

const registry = createRegistry();
const server = await createKafkaTransport(registry, {
  brokers: ['localhost:9092'],
  groupId: 'my-service'
});
```
