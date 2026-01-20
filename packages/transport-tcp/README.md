# @elysia-microservice/transport-tcp

TCP transport server for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/transport-tcp
```

## Usage

```typescript
import { createTcpTransport } from '@elysia-microservice/transport-tcp';
import { createRegistry } from '@elysia-microservice/core';

const registry = createRegistry();
const server = createTcpTransport(registry, { port: 4000, host: '127.0.0.1' });
```
