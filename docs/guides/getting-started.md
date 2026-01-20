# Getting Started with Elysia Microservice Framework

This guide will help you get up and running with the Elysia Microservice Framework in minutes.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0 (recommended) or Node.js >= 18
- Basic understanding of TypeScript
- Familiarity with [Elysia](https://elysiajs.com/) is helpful but not required

## Installation

The framework is modular - install only what you need:

### Core Package (Required)

```bash
bun add @elysia-microservice/core elysia
```

### Choose Your Transport

**TCP** (simplest, good for development):
```bash
bun add @elysia-microservice/transport-tcp @elysia-microservice/client-tcp
```

**TLS** (TCP with SSL/TLS):
```bash
bun add @elysia-microservice/transport-tls @elysia-microservice/client-tls
```

**NATS** (message broker, pub/sub):
```bash
bun add @elysia-microservice/transport-nats @elysia-microservice/client-nats nats
```

**Redis** (pub/sub, requires Redis server):
```bash
bun add @elysia-microservice/transport-redis @elysia-microservice/client-redis redis
```

**Kafka** (event streaming):
```bash
bun add @elysia-microservice/transport-kafka @elysia-microservice/client-kafka kafkajs
```

## Your First Microservice

### Option 1: Hybrid Mode (HTTP + Microservice)

Perfect for applications that need both REST APIs and microservice communication:

**server.ts**
```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { 
      transport: 'tcp', 
      options: { port: 4000 } 
    },
    hybrid: true  // Enables HTTP health endpoints
  }))
  // Microservice message handler (request/response)
  .onMsMessage('user.get', async (ctx) => {
    return { 
      id: ctx.data.id, 
      name: 'John Doe',
      email: 'john@example.com'
    };
  })
  // Microservice event handler (fire-and-forget)
  .onMsEvent('user.created', (ctx) => {
    console.log('New user created:', ctx.data);
    // Send welcome email, update analytics, etc.
  })
  // Regular HTTP endpoints
  .get('/', () => 'Hello from Elysia!')
  .get('/health', () => ({ status: 'ok' }))
  .listen(3000);

console.log('🚀 HTTP server: http://localhost:3000');
console.log('🔌 Microservice: tcp://localhost:4000');
```

**client.ts**
```typescript
import { createTcpClient } from '@elysia-microservice/client-tcp';

const client = createTcpClient({ 
  host: '127.0.0.1', 
  port: 4000 
});

// Send request and wait for response
const user = await client.send('user.get', { id: 1 });
console.log('User:', user);
// Output: User: { id: 1, name: 'John Doe', email: 'john@example.com' }

// Emit event (no response expected)
await client.emit('user.created', { 
  id: 2, 
  name: 'Jane Smith' 
});

await client.close();
```

### Option 2: Standalone Mode (Microservice Only)

Perfect for pure microservice applications:

**server.ts**
```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { 
      transport: 'tcp', 
      options: { port: 4000 } 
    }
  }))
  .onMsMessage('order.create', async (ctx) => {
    // Process order
    return { 
      orderId: Math.random().toString(36),
      status: 'created',
      items: ctx.data.items
    };
  })
  .onMsEvent('payment.received', (ctx) => {
    console.log('Payment received for order:', ctx.data.orderId);
  });

// Start microservice manually in standalone mode
await app.microservice.start();
await app.microservice.awaitReady();

console.log('🔌 Microservice running on tcp://localhost:4000');
```

### Option 3: Low-Level API

For maximum control over the microservice:

**server.ts**
```typescript
import { createRegistry } from '@elysia-microservice/core';
import { createTcpTransport } from '@elysia-microservice/transport-tcp';

const registry = createRegistry();

// Register handlers
registry.registerMessage('user.get', async (ctx) => {
  return { id: ctx.data.id, name: 'John Doe' };
});

registry.registerEvent('user.created', (ctx) => {
  console.log('User created:', ctx.data);
});

// Start transport
const server = createTcpTransport(registry, { port: 4000 });

console.log('🔌 Microservice running on tcp://localhost:4000');
```

## Understanding Message Context

All handlers receive a `MessageContext` object:

```typescript
interface MessageContext {
  pattern: string;      // The matched pattern
  data: any;           // The message payload
  meta?: any;          // Transport-specific metadata
  store?: Map<any, any>; // Shared state between hooks
}
```

Example:

```typescript
.onMsMessage('user.*', (ctx) => {
  console.log('Pattern:', ctx.pattern);  // e.g., "user.create"
  console.log('Data:', ctx.data);        // e.g., { name: "John" }
  console.log('Meta:', ctx.meta);        // e.g., { clientId: "..." }
  
  return { success: true };
})
```

## Pattern Matching

The framework supports powerful pattern matching:

### Exact Patterns

```typescript
.onMsMessage('user.get', (ctx) => {
  // Only matches "user.get"
})
```

### Wildcard Patterns

```typescript
.onMsMessage('user.*', (ctx) => {
  // Matches: user.get, user.create, user.update, etc.
  console.log('Matched:', ctx.pattern);
})
```

### Regex Patterns

```typescript
.onMsMessage(/^user\.(create|update)$/, (ctx) => {
  // Matches: user.create, user.update
  // Does NOT match: user.get, user.delete
})
```

### Catchall Handlers

```typescript
.onMsCatchallMessage((pattern, data) => {
  console.warn(`No handler found for: ${pattern}`);
  return { error: 'Pattern not found' };
})
```

See [Pattern Matching Guide](../PATTERN_MATCHING.md) for advanced patterns.

## Messages vs Events

### Messages (Request/Response)

- **Synchronous** - client waits for response
- Use `onMsMessage()` on server
- Use `client.send()` on client
- Must return a value
- Use for queries, commands that need confirmation

```typescript
// Server
.onMsMessage('calculate.sum', (ctx) => {
  return { result: ctx.data.a + ctx.data.b };
})

// Client
const response = await client.send('calculate.sum', { a: 5, b: 3 });
console.log(response.result); // 8
```

### Events (Fire-and-Forget)

- **Asynchronous** - client doesn't wait for response
- Use `onMsEvent()` on server
- Use `client.emit()` on client
- Return value is ignored
- Use for notifications, logging, side effects

```typescript
// Server
.onMsEvent('user.login', (ctx) => {
  console.log('User logged in:', ctx.data.userId);
  // Update last login time, send analytics, etc.
})

// Client
await client.emit('user.login', { userId: 123 });
// Continues immediately without waiting
```

## Using Different Transports

### NATS

```typescript
// Server
import { Microservice } from '@elysia-microservice/core';

.use(Microservice({
  server: {
    transport: 'nats',
    options: {
      servers: ['nats://localhost:4222']
    }
  }
}))

// Client
import { createNatsClient } from '@elysia-microservice/client-nats';

const client = await createNatsClient({
  servers: ['nats://localhost:4222']
});
```

### Redis

```typescript
// Server
.use(Microservice({
  server: {
    transport: 'redis',
    options: {
      host: 'localhost',
      port: 6379
    }
  }
}))

// Client
import { createRedisClient } from '@elysia-microservice/client-redis';

const client = await createRedisClient({
  host: 'localhost',
  port: 6379
});
```

### Kafka

```typescript
// Server
.use(Microservice({
  server: {
    transport: 'kafka',
    options: {
      clientId: 'my-service',
      brokers: ['localhost:9092'],
      consumerGroupId: 'my-group'
    }
  }
}))

// Client
import { createKafkaClient } from '@elysia-microservice/client-kafka';

const client = await createKafkaClient({
  clientId: 'my-client',
  brokers: ['localhost:9092']
});
```

## Next Steps

- Learn about [Pattern Matching](../PATTERN_MATCHING.md)
- Explore [Advanced Features](./advanced-features.md)
- Add [Service Discovery](./service-discovery.md)
- Implement [Resilience Patterns](./resilience.md)
- Deploy to [Production](./deployment.md)
- Check out [Examples](../../examples/)

## Troubleshooting

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4000
```

Solution: Change the port or kill the process using it:
```bash
lsof -ti:4000 | xargs kill -9
```

### Cannot Connect to Microservice

1. Verify the server is running
2. Check firewall settings
3. Ensure host and port match between client and server
4. For NATS/Redis/Kafka, verify the broker is running

### Type Errors

Make sure you have TypeScript configured properly:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "esnext",
    "strict": true
  }
}
```

## Need Help?

- 📖 Read the [Documentation](../../README.md)
- 💬 Ask in [GitHub Discussions](https://github.com/your-repo/discussions)
- 🐛 Report bugs in [GitHub Issues](https://github.com/your-repo/issues)
- 📧 Contact maintainers

Happy coding! 🚀
