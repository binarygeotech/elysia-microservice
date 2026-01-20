# @elysia-microservice/transport-tls

TLS/SSL transport server for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/transport-tls
```

## Usage

```typescript
import { createTlsTransport } from '@elysia-microservice/transport-tls';
import { createRegistry } from '@elysia-microservice/core';

const registry = createRegistry();
const server = createTlsTransport(registry, {
  port: 4001,
  host: '127.0.0.1',
  key: './certs/server-key.pem',
  cert: './certs/server-cert.pem',
  ca: './certs/ca-cert.pem'
});
```
