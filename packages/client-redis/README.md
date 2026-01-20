# @elysia-microservice/client-redis

Redis client for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/client-redis redis
```

## Usage

```typescript
import { createRedisClient } from '@elysia-microservice/client-redis';

const client = await createRedisClient({ url: 'redis://localhost:6379' });
const result = await client.send('get.user', { id: 1 });
await client.emit('user.created', { id: 1, name: 'John' });
```
