# Quick Start Guide

Get up and running with Elysia Microservices in under 5 minutes!

## Prerequisites

- [Bun](https://bun.sh) v1.3.5 or higher
- Node.js v18 or higher (for compatibility)
- Basic knowledge of TypeScript and Elysia

## Installation

### From This Monorepo (Development)

```bash
# Clone the repository
git clone <repository-url>
cd elysia-ms

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
cd packages/core && bun test
```

### From NPM (When Published)

```bash
# Core package (required)
bun add @elysia-microservice/core

# Choose your transport(s)
bun add @elysia-microservice/transport-tcp
bun add @elysia-microservice/transport-nats

# Choose your client(s)
bun add @elysia-microservice/client-tcp
bun add @elysia-microservice/client-nats

# Optional: utilities and adapters
bun add @elysia-microservice/utils
bun add @elysia-microservice/client-base
bun add @elysia-microservice/adapters
```

## Your First Microservice

### 1. Create a Simple TCP Server

Create `server.ts`:

```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({
    server: { transport: 'tcp', options: { port: 4000 } }
  }))
  .onMsMessage('hello', async (data: any) => {
    return { message: `Hello, ${data.name}!` };
  })
  .onMsEvent('log', (data: any) => {
    console.log('Received log:', data);
  });

// Start the microservice
await app.microservice.start();
console.log('✅ Microservice running on tcp://localhost:4000');
```

Run it:
```bash
bun run server.ts
```

### 2. Create a Client

Create `client.ts`:

```typescript
import { createTcpClient } from '@elysia-microservice/client-tcp';

const client = createTcpClient({ 
  host: '127.0.0.1',
  port: 4000 
});

// Send message and wait for response
const response = await client.send('hello', { name: 'World' });
console.log(response); // { message: "Hello, World!" }

// Emit event (fire-and-forget)
await client.emit('log', { level: 'info', msg: 'Test log' });

// Clean up
await client.close();
```

Run it in another terminal:
```bash
bun run client.ts
```

## Hybrid Mode (HTTP + Microservice)

Create `hybrid-server.ts`:

```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } },
    hybrid: true  // Enable hybrid mode
  }))
  // Microservice handlers
  .onMsMessage('get.user', async (data: any) => {
    return { id: data.id, name: 'John Doe' };
  })
  // HTTP routes
  .get('/', () => 'Welcome to Hybrid Server!')
  .get('/health', () => ({
    status: app.microservice.health() ? 'healthy' : 'unhealthy'
  }))
  .listen(3000);

console.log('🚀 HTTP: http://localhost:3000');
console.log('🔌 Microservice: tcp://localhost:4000');
```

Run it:
```bash
bun run hybrid-server.ts
```

Test HTTP:
```bash
curl http://localhost:3000
curl http://localhost:3000/health
```

Test microservice:
```typescript
// Use the same client.ts from above, just change the pattern
const response = await client.send('get.user', { id: 123 });
```

## Using Different Transports

### NATS

Server:
```typescript
import { Microservice } from '@elysia-microservice/core';

.use(Microservice({
  server: { 
    transport: 'nats', 
    options: { servers: 'nats://localhost:4222' }
  }
}))
```

Client:
```typescript
import { createNatsClient } from '@elysia-microservice/client-nats';

const client = createNatsClient({ 
  servers: 'nats://localhost:4222' 
});
```

### Redis

Server:
```typescript
.use(Microservice({
  server: { 
    transport: 'redis', 
    options: { url: 'redis://localhost:6379' }
  }
}))
```

Client:
```typescript
import { createRedisClient } from '@elysia-microservice/client-redis';

const client = createRedisClient({ 
  url: 'redis://localhost:6379' 
});
```

### Kafka

Server:
```typescript
.use(Microservice({
  server: { 
    transport: 'kafka', 
    options: { 
      brokers: ['localhost:9092'],
      groupId: 'my-service'
    }
  }
}))
```

Client:
```typescript
import { createKafkaClient } from '@elysia-microservice/client-kafka';

const client = createKafkaClient({ 
  brokers: ['localhost:9092'],
  clientId: 'my-client'
});
```

## Common Patterns

### Request-Response

```typescript
// Server
.onMsMessage('calculate.sum', async (data: any) => {
  return { result: data.a + data.b };
})

// Client
const result = await client.send('calculate.sum', { a: 5, b: 3 });
console.log(result); // { result: 8 }
```

### Fire-and-Forget Events

```typescript
// Server
.onMsEvent('user.created', (data: any) => {
  console.log('New user:', data);
  // Send email, update cache, etc.
})

// Client
await client.emit('user.created', { 
  id: 123, 
  email: 'user@example.com' 
});
```

### Multiple Clients

```typescript
.use(Microservice({
  server: { transport: 'tcp', options: { port: 4000 } },
  clients: {
    userService: {
      transport: 'tcp',
      options: { host: 'user-service', port: 5000 }
    },
    authService: {
      transport: 'nats',
      options: { servers: 'nats://nats-server:4222' }
    }
  }
}))

// Access clients
const user = await app.microservice.clients.userService.send('get.user', { id: 1 });
const auth = await app.microservice.clients.authService.send('validate.token', { token });
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from 'bun:test';
import { createRegistry } from '@elysia-microservice/core';

describe('My Service', () => {
  it('should handle user requests', async () => {
    const registry = createRegistry();
    
    registry.registerRequest('get.user', async (data) => {
      return { id: data.id, name: 'Test User' };
    });
    
    const handler = registry.requests.get('get.user');
    const result = await handler({ id: 1 });
    
    expect(result.name).toBe('Test User');
  });
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

describe('Integration', () => {
  let app, client;
  
  beforeAll(async () => {
    app = createServer();
    await app.microservice.start();
    client = createClient();
  });
  
  afterAll(async () => {
    await client.close();
    await app.microservice.stop();
  });
  
  it('should communicate', async () => {
    const result = await client.send('test', { data: 'test' });
    expect(result).toBeDefined();
  });
});
```

## Deployment

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

CMD ["bun", "run", "dist/server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api-gateway:
    build: ./gateway
    ports:
      - "3000:3000"
      - "4000:4000"
    environment:
      - NODE_ENV=production
      
  user-service:
    build: ./services/user
    environment:
      - NATS_URL=nats://nats:4222
    depends_on:
      - nats
      
  nats:
    image: nats:latest
    ports:
      - "4222:4222"
```

## Next Steps

- Read the [Architecture Guide](./ARCHITECTURE.md) to understand the design
- Check [Examples](./examples/README.md) for more advanced patterns
- See [MIGRATION.md](./MIGRATION.md) if migrating from the monolithic version
- Explore individual package READMEs for transport-specific features
- Review [SUMMARY.md](./SUMMARY.md) for the complete transformation overview

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### NATS Connection Failed

```bash
# Start NATS with Docker
docker run -p 4222:4222 nats:latest
```

### Redis Connection Failed

```bash
# Start Redis with Docker
docker run -p 6379:6379 redis:latest
```

### Kafka Connection Failed

```bash
# Start Kafka with Docker
docker-compose up -d kafka zookeeper
```

### Build Errors

```bash
# Clean and rebuild
bun run clean
bun install
bun run build
```

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Examples**: Check the `/examples` directory
- **Tests**: Review test files for usage patterns

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Adding new transports
- Improving documentation
- Submitting bug fixes
- Proposing new features

Happy coding! 🎉
