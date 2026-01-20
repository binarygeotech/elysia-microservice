# @elysia-microservice/adapters

Adapters for integrating Elysia microservices with other frameworks.

## Features

- **NestJS Adapter**: Use NestJS-style decorators (`@MessagePattern`, `@EventPattern`) with Elysia microservices

## Installation

```bash
bun add @elysia-microservice/adapters
```

## Usage

### NestJS Adapter

```typescript
import { MessagePattern, EventPattern } from '@elysia-microservice/core';
import { adaptNestMessages } from '@elysia-microservice/adapters';
import { createRegistry } from '@elysia-microservice/core';

class UserController {
  @MessagePattern('get.user')
  async getUser(data: { id: number }) {
    return { id: data.id, name: 'John' };
  }

  @EventPattern('user.created')
  handleUserCreated(data: { id: number }) {
    console.log('User created:', data.id);
  }
}

const registry = createRegistry();
const controller = new UserController();
adaptNestMessages(controller, registry);
```
