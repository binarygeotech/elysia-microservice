# @elysia-microservice/client-kafka

Kafka client for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/client-kafka kafkajs
```

## Usage

```typescript
import { createKafkaClient } from '@elysia-microservice/client-kafka';

const client = await createKafkaClient({
  brokers: ['localhost:9092'],
  clientId: 'my-client'
});
await client.emit('user.created', { id: 1, name: 'John' });
```

**Note**: Kafka does not support request/response pattern safely. Use `emit()` for fire-and-forget events only.
