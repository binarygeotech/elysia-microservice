# @elysia-microservice/client-base

Base client utilities, factory, and resilience patterns for Elysia microservices framework.

## Features

- **Client Factory**: Dynamically create clients for any transport
- **Client Proxy**: Type-safe proxy for client methods
- **Resilience**: Circuit breaker and retry patterns

## Installation

```bash
bun add @elysia-microservice/client-base
```

## Usage

### Client Factory

```typescript
import { createClient } from '@elysia-microservice/client-base';

const client = await createClient({
  transport: 'tcp',
  options: { host: '127.0.0.1', port: 4000 }
});
```

### Client Proxy

```typescript
import { createClientProxy } from '@elysia-microservice/client-base';

const userService = createClientProxy(client, {
  getUser: { type: 'send', pattern: 'get.user' },
  createUser: { type: 'send', pattern: 'create.user' },
  userCreated: { type: 'emit', pattern: 'user.created' }
});

const user = await userService.getUser({ id: 1 });
```

### Resilience

```typescript
import { withResilience } from '@elysia-microservice/client-base';

const resilientClient = withResilience(client, {
  retries: 3,
  timeout: 5000,
  breakerThreshold: 5
});
```
