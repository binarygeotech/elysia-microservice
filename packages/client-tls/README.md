# @elysia-microservice/client-tls

TLS/SSL client for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/client-tls
```

## Usage

```typescript
import { createTlsClient } from '@elysia-microservice/client-tls';

const client = createTlsClient({
  port: 4001,
  host: '127.0.0.1',
  key: './certs/client-key.pem',
  cert: './certs/client-cert.pem',
  ca: './certs/ca-cert.pem'
});
const result = await client.send('get.user', { id: 1 });
```
