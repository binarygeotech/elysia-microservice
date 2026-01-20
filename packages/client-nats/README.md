# @elysia-microservice/client-nats

NATS client for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/client-nats nats
```

## Usage

```typescript
import { createNatsClient } from '@elysia-microservice/client-nats';

const client = await createNatsClient({ url: 'nats://localhost:4222' });
const result = await client.send('get.user', { id: 1 });
await client.emit('user.created', { id: 1, name: 'John' });
```
