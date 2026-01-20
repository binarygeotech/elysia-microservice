# @elysia-microservice/transport-redis

Redis transport server for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/transport-redis redis
```

## Usage

```typescript
import { createRedisTransport } from '@elysia-microservice/transport-redis';
import { createRegistry } from '@elysia-microservice/core';

const registry = createRegistry();
const server = await createRedisTransport(registry, {
  url: 'redis://localhost:6379'
});
```
