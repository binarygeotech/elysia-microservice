# @elysia-microservice/client-tcp

TCP client for Elysia microservices framework.

## Installation

```bash
bun add @elysia-microservice/client-tcp
```

## Usage

```typescript
import { createTcpClient } from '@elysia-microservice/client-tcp';

const client = createTcpClient({ port: 4000, host: '127.0.0.1' });
const result = await client.send('get.user', { id: 1 });
await client.emit('user.created', { id: 1, name: 'John' });
```
