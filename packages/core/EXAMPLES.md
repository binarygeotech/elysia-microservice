# Examples

This directory contains examples for using the Elysia microservice framework.

## Plugin Mode Examples

### 1. Basic Hybrid Server

Combine HTTP and microservice in one application.

```typescript
// examples/hybrid-server.ts
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } },
    hybrid: true 
  }))
  // Microservice patterns
  .onMsMessage('get.user', async (data) => {
    return { id: data.id, name: 'John Doe', email: 'john@example.com' };
  })
  .onMsEvent('user.updated', (data) => {
    console.log('User updated:', data);
  })
  // HTTP routes
  .get('/', () => 'Welcome to Hybrid Server!')
  .get('/api/status', () => ({
    http: 'running',
    microservice: app.microservice.ready()
  }))
  .listen(3000);

console.log('🚀 HTTP: http://localhost:3000');
console.log('🔌 Microservice: tcp://localhost:4000');
```

### 2. Microservice with Clients

Communicate with other microservices.

```typescript
// examples/with-clients.ts
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } },
    clients: {
      authService: {
        transport: 'tcp',
        options: { host: '127.0.0.1', port: 4001 }
      },
      userService: {
        transport: 'tcp',
        options: { host: '127.0.0.1', port: 4002 },
        resilience: {
          retries: 3,
          timeout: 5000,
          breakerThreshold: 5
        }
      }
    }
  }))
  .onMsMessage('get.profile', async (data) => {
    // Call other services
    const auth = await app.microservice.clients.authService.send('verify', data.token);
    if (!auth.valid) throw new Error('Unauthorized');
    
    const user = await app.microservice.clients.userService.send('get.user', { id: auth.userId });
    return { ...user, profile: 'extended data' };
  });

await app.microservice.start();
```

## Standalone Mode Examples

### 3. Pure Microservice Server

No HTTP server, just microservice.

```typescript
// examples/standalone-server.ts
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } }
  }))
  .onMsMessage('get.user', async (data) => {
    return { id: data.id, name: 'John Doe' };
  })
  .onMsMessage('create.user', async (data) => {
    // Create user logic
    return { id: Math.random(), ...data };
  })
  .onMsEvent('user.created', (data) => {
    console.log('New user:', data);
  });

await app.microservice.start();
await app.microservice.awaitReady();

console.log('✅ Microservice ready on tcp://localhost:4000');
```

### 4. Multiple Transports

Different services on different transports.

```typescript
// examples/multi-transport.ts
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

// NATS-based service
const natsService = new Elysia()
  .use(Microservice({ 
    server: { transport: 'nats', options: { url: 'nats://localhost:4222' } }
  }))
  .onMsMessage('get.user', async (data) => ({ id: data.id, name: 'John' }));

await natsService.microservice.start();
console.log('✅ NATS service ready');

// Redis-based service
const redisService = new Elysia()
  .use(Microservice({ 
    server: { transport: 'redis', options: { url: 'redis://localhost:6379' } }
  }))
  .onMsMessage('get.config', async () => ({ theme: 'dark', lang: 'en' }));

await redisService.microservice.start();
console.log('✅ Redis service ready');
```

## Low-Level API Examples

### 5. Direct Registry Usage

For maximum control.

```typescript
// examples/low-level.ts
import { createRegistry } from '@elysia-microservice/core';
import { createTcpTransport } from '@elysia-microservice/transport-tcp';
import { createTcpClient } from '@elysia-microservice/client-tcp';

// Server
const registry = createRegistry();

registry.registerMessage('math.add', async (data) => {
  return { result: data.a + data.b };
});

registry.registerMessage('math.multiply', async (data) => {
  return { result: data.a * data.b };
});

const server = createTcpTransport(registry, { port: 4000 });
console.log('Server running on tcp://localhost:4000');

// Client
const client = createTcpClient({ port: 4000 });

const sum = await client.send('math.add', { a: 5, b: 3 });
console.log('5 + 3 =', sum.result);

const product = await client.send('math.multiply', { a: 5, b: 3 });
console.log('5 * 3 =', product.result);
```

### 6. With Service Discovery

Load balancing across multiple instances.

```typescript
// examples/load-balancing.ts
import { createClient, withResilience } from '@elysia-microservice/client-base';
import { StaticDiscovery, RoundRobinBalancer, createClientPool } from '@elysia-microservice/utils';

const discovery = new StaticDiscovery([
  { host: '127.0.0.1', port: 4000 },
  { host: '127.0.0.1', port: 4001 },
  { host: '127.0.0.1', port: 4002 }
]);

const balancer = new RoundRobinBalancer();

const pool = createClientPool(
  discovery,
  balancer,
  { transport: 'tcp' },
  createClient
);

// Automatically distributes requests across instances
const user1 = await pool.send('get.user', { id: 1 });
const user2 = await pool.send('get.user', { id: 2 });
const user3 = await pool.send('get.user', { id: 3 });
```

## Running Examples

```bash
# Run hybrid server
bun run examples/hybrid-server.ts

# Run standalone server
bun run examples/standalone-server.ts

# Run with clients
bun run examples/with-clients.ts
```
