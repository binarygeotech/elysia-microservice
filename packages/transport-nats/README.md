# @elysia-microservice/transport-nats

NATS transport server for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/transport-nats nats
```

## Usage

```typescript
import { createNatsTransport } from '@elysia-microservice/transport-nats';
import { createRegistry } from '@elysia-microservice/core';

const registry = createRegistry();
const server = await createNatsTransport(registry, {
  url: 'nats://localhost:4222'
});
```
