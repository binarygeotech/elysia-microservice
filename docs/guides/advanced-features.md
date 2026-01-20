# Advanced Features

This guide covers advanced features of the Elysia Microservice Framework.

## Lifecycle Hooks

Pattern handlers support lifecycle hooks for cross-cutting concerns like logging, validation, and metrics.

### Handler-Level Hooks

Add hooks to specific handlers:

```typescript
import { createRegistry } from '@elysia-microservice/core';

const registry = createRegistry();

registry.registerMessage(
  'user.create',
  async (ctx) => {
    return { id: 123, name: ctx.data.name };
  },
  {
    onBefore: async (ctx) => {
      console.log('Before handler:', ctx.pattern, ctx.data);
      // Validate, authenticate, log, etc.
      
      // Optionally modify context
      ctx.store?.set('startTime', Date.now());
    },
    onAfter: async (ctx, result) => {
      const startTime = ctx.store?.get('startTime');
      const duration = Date.now() - startTime;
      console.log('After handler:', ctx.pattern, duration, 'ms');
      
      // Log metrics, cleanup, etc.
    }
  }
);
```

### Global Hooks

Apply hooks to all request or event handlers:

```typescript
const registry = createRegistry();

// Global hooks for all request messages
registry.setRequestHooks({
  onBefore: async (ctx) => {
    console.log('[REQUEST]', ctx.pattern, ctx.data);
    ctx.store?.set('requestTime', Date.now());
  },
  onAfter: async (ctx, result) => {
    const duration = Date.now() - (ctx.store?.get('requestTime') || 0);
    console.log('[RESPONSE]', ctx.pattern, duration, 'ms');
  }
});

// Global hooks for all events
registry.setEventHooks({
  onBefore: async (ctx) => {
    console.log('[EVENT]', ctx.pattern, ctx.data);
  },
  onAfter: async (ctx) => {
    console.log('[EVENT PROCESSED]', ctx.pattern);
  }
});
```

### Hook Execution Order

```
Global onBefore
  → Handler-specific onBefore
    → Handler function
  → Handler-specific onAfter
→ Global onAfter
```

### Use Cases

**Authentication:**
```typescript
registry.setRequestHooks({
  onBefore: async (ctx) => {
    const token = ctx.meta?.token;
    if (!token || !isValidToken(token)) {
      throw new Error('Unauthorized');
    }
    ctx.store?.set('user', decodeToken(token));
  }
});
```

**Metrics:**
```typescript
registry.setRequestHooks({
  onBefore: async (ctx) => {
    metrics.increment(`request.${ctx.pattern}.count`);
    ctx.store?.set('start', performance.now());
  },
  onAfter: async (ctx) => {
    const duration = performance.now() - ctx.store?.get('start');
    metrics.timing(`request.${ctx.pattern}.duration`, duration);
  }
});
```

**Logging:**
```typescript
registry.setRequestHooks({
  onBefore: async (ctx) => {
    logger.info({
      event: 'request_started',
      pattern: ctx.pattern,
      data: ctx.data,
      meta: ctx.meta
    });
  },
  onAfter: async (ctx, result) => {
    logger.info({
      event: 'request_completed',
      pattern: ctx.pattern,
      result
    });
  }
});
```

## Error Handling

### Per-Handler Error Handling

Handle errors in individual handlers:

```typescript
.onMsMessage('user.get', async (ctx) => {
  try {
    const user = await db.users.findOne({ id: ctx.data.id });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return { error: error.message };
  }
})
```

### Global Error Handlers

Set global error handlers for all requests or events:

```typescript
const registry = createRegistry();

// Global request error handler
registry.setRequestErrorHandler(async (error, ctx) => {
  console.error('[REQUEST ERROR]', ctx.pattern, error);
  
  // Return error response
  return {
    error: error.message,
    pattern: ctx.pattern,
    timestamp: Date.now()
  };
});

// Global event error handler
registry.setEventErrorHandler(async (error, ctx) => {
  console.error('[EVENT ERROR]', ctx.pattern, error);
  
  // Log to error tracking service
  errorTracker.captureException(error, {
    pattern: ctx.pattern,
    data: ctx.data
  });
});
```

## Client Factory & Proxy

### Client Factory

Create clients dynamically based on transport type:

```typescript
import { createClient } from '@elysia-microservice/client-base';

const tcpClient = await createClient({
  transport: 'tcp',
  options: { host: '127.0.0.1', port: 4000 }
});

const natsClient = await createClient({
  transport: 'nats',
  options: { servers: ['nats://localhost:4222'] }
});
```

### Type-Safe Proxy Client

Create a type-safe client with IntelliSense:

```typescript
import { createClientProxy } from '@elysia-microservice/client-base';

interface IUserService {
  'user.get': (data: { id: number }) => Promise<{ id: number; name: string }>;
  'user.create': (data: { name: string }) => Promise<{ id: number }>;
  'user.delete': (data: { id: number }) => Promise<void>;
}

const client = await createClientProxy<IUserService>({
  transport: 'tcp',
  options: { port: 4000 }
});

// Type-safe calls with IntelliSense
const user = await client['user.get']({ id: 1 });
console.log(user.name); // TypeScript knows the response type
```

## Resilience Patterns

Add retries, timeouts, and circuit breakers:

```typescript
import { createClient, withResilience } from '@elysia-microservice/client-base';

let client = await createClient({
  transport: 'tcp',
  options: { port: 4000 }
});

client = withResilience(client, {
  retries: 3,           // Retry failed requests up to 3 times
  retryDelay: 1000,     // Wait 1 second between retries
  timeout: 5000,        // Timeout after 5 seconds
  breakerThreshold: 5,  // Open circuit after 5 failures
  breakerTimeout: 30000 // Reset circuit after 30 seconds
});

// Requests now have automatic retries and circuit breaking
const user = await client.send('user.get', { id: 1 });
```

## Service Discovery

### Static Discovery

Configure known service endpoints:

```typescript
import { StaticDiscovery } from '@elysia-microservice/utils';

const discovery = new StaticDiscovery({
  'user-service': [
    { host: '127.0.0.1', port: 4001 },
    { host: '127.0.0.1', port: 4002 },
    { host: '127.0.0.1', port: 4003 }
  ],
  'order-service': [
    { host: '127.0.0.1', port: 5001 }
  ]
});

const endpoints = await discovery.discover('user-service');
console.log(endpoints); // All 3 user service instances
```

### DNS-Based Discovery

Discover services via DNS SRV records:

```typescript
import { DnsDiscovery } from '@elysia-microservice/utils';

const discovery = new DnsDiscovery({
  domain: 'services.example.com',
  refreshInterval: 60000 // Refresh every minute
});

// Discovers _user-service._tcp.services.example.com
const endpoints = await discovery.discover('user-service');
```

## Load Balancing

### Round-Robin

Distribute requests evenly across instances:

```typescript
import { RoundRobinLoadBalancer } from '@elysia-microservice/utils';
import { createClient } from '@elysia-microservice/client-base';

const loadBalancer = new RoundRobinLoadBalancer([
  { host: '127.0.0.1', port: 4001 },
  { host: '127.0.0.1', port: 4002 },
  { host: '127.0.0.1', port: 4003 }
]);

// Get next endpoint
const endpoint = loadBalancer.next();

const client = await createClient({
  transport: 'tcp',
  options: endpoint
});
```

### With Failure Tracking

Automatically remove failed instances:

```typescript
const loadBalancer = new RoundRobinLoadBalancer(endpoints, {
  maxFailures: 3,      // Remove after 3 failures
  failureTimeout: 60000 // Retry after 1 minute
});

// Mark failure
try {
  await client.send('user.get', { id: 1 });
} catch (error) {
  loadBalancer.markFailure(endpoint);
}

// Mark success
loadBalancer.markSuccess(endpoint);
```

## Connection Pooling

Reuse connections for better performance:

```typescript
import { ClientPool } from '@elysia-microservice/utils';

const pool = await ClientPool.create({
  transport: 'tcp',
  options: { host: '127.0.0.1', port: 4000 },
  poolSize: 10,              // 10 connections
  acquireTimeout: 5000,      // Wait up to 5s for connection
  idleTimeout: 30000,        // Close idle connections after 30s
  reconnectOnError: true,    // Auto-reconnect on errors
  healthCheckInterval: 10000 // Check health every 10s
});

// Acquire from pool
const client = await pool.acquire();

try {
  const user = await client.send('user.get', { id: 1 });
  console.log(user);
} finally {
  // Always release back to pool
  pool.release(client);
}

// Or use the convenience method
const result = await pool.withClient(async (client) => {
  return await client.send('user.get', { id: 1 });
});

// Cleanup
await pool.closeAll();
```

## Chaos Engineering

Test failure scenarios:

```typescript
import { ChaosClient } from '@elysia-microservice/utils';

let client = await createClient({
  transport: 'tcp',
  options: { port: 4000 }
});

// Wrap with chaos client
client = new ChaosClient(client, {
  failureRate: 0.1,    // 10% of requests fail
  latency: 1000,       // Add 1 second delay
  latencyJitter: 500   // ± 500ms random jitter
});

// Some requests will fail or be delayed
const user = await client.send('user.get', { id: 1 });
```

## NestJS Compatibility

Use NestJS decorators with Elysia:

```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';
import { NestAdapter } from '@elysia-microservice/adapters';
import { Controller, MessagePattern, EventPattern } from '@nestjs/common';

@Controller()
class UserController {
  @MessagePattern('user.get')
  getUser(data: { id: number }) {
    return { id: data.id, name: 'John Doe' };
  }

  @EventPattern('user.created')
  handleUserCreated(data: any) {
    console.log('User created:', data);
  }
}

const app = new Elysia()
  .use(Microservice({
    server: { transport: 'tcp', options: { port: 4000 } }
  }));

// Register NestJS controller
const adapter = new NestAdapter(app.microservice.registry);
adapter.registerController(UserController);

await app.microservice.start();
```

## Next Steps

- Explore [Deployment Strategies](./deployment.md)
- Learn about [Monitoring & Observability](./monitoring.md)
- Check out [Best Practices](./best-practices.md)
