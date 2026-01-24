# @elysia-microservice/core

Core functionality for the Elysia microservices framework including the Microservice plugin.

## Features

- **🔌 Microservice Plugin**: Turn Elysia into a microservice server
- **📝 Registry System**: Register message handlers, event handlers, and clients
- **📡 Protocol**: Frame encoding/decoding for message passing
- **🎯 Patterns**: Decorators for message and event patterns
- **🛡️ Guards & Middleware**: Hierarchical DI system (global, group, handler scopes)
- **🔄 Context Management**: Request context handling with metadata support
- **🛑 Graceful Shutdown**: Handle process termination gracefully
- **📊 Tracing**: Tracing interface for observability
- **🔀 Two Modes**: Plugin mode (hybrid HTTP + microservice) or standalone mode

## Installation

```bash
bun add @elysia-microservice/core
```

## Usage Modes

### 1. Plugin Mode (Hybrid: HTTP + Microservice)

Run microservice alongside your HTTP server. Perfect for apps that need both REST APIs and microservice communication.

```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } },
    hybrid: true  // Enable HTTP health endpoints
  }))
  // Microservice handlers
  .onMsMessage('get.user', async (data) => {
    return { id: data.id, name: 'John Doe' };
  })
  .onMsEvent('user.created', (data) => {
    console.log('User created:', data);
  })
  // Regular HTTP routes
  .get('/', () => 'Hello from HTTP!')
  .get('/health', () => 'OK')
  .listen(3000);  // HTTP server on port 3000, microservice on 4000

console.log('HTTP server on http://localhost:3000');
console.log('Microservice on tcp://localhost:4000');
```

Health endpoints (when `hybrid: true`):
- `GET /health` - Returns `{ status: "ok" | "down" }`
- `GET /ready` - Returns `{ ready: boolean }`

### 2. Standalone Mode (Microservice Only)

Run only the microservice without HTTP server. Perfect for pure microservice applications.

```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } }
  }))
  .onMsMessage('get.user', async (data) => {
    return { id: data.id, name: 'John Doe' };
  })
  .onMsEvent('user.created', (data) => {
    console.log('User created:', data);
  });

// Manually start the microservice
await app.microservice.start();
await app.microservice.awaitReady();

console.log('Microservice running on tcp://localhost:4000');
```

### 3. Low-Level API (Without Plugin)

Use the registry directly for more control.

```typescript
import { createRegistry } from '@elysia-microservice/core';
import { createTcpTransport } from '@elysia-microservice/transport-tcp';

const registry = createRegistry();

registry.registerMessage('get.user', async (data) => {
  return { id: data.id, name: 'John' };
});

registry.registerEvent('user.created', (data) => {
  console.log('User created:', data);
});

const server = createTcpTransport(registry, { port: 4000 });
```

## API Reference

### Plugin Configuration

```typescript
interface MicroserviceConfig {
  // Server transport configuration
  server?: {
    transport: 'tcp' | 'tls' | 'redis' | 'nats' | 'kafka';
    options?: any;  // Transport-specific options
  };
  
  // Client configurations
  clients?: Record<string, {
    transport: 'tcp' | 'tls' | 'redis' | 'nats' | 'kafka';
    options?: any;
    resilience?: {
      retries: number;
      timeout: number;
      breakerThreshold: number;
    };
    discovery?: {
      strategy: string;
      endpoints: Array<{ host: string; port: number }>;
    };
    chaos?: {
      failRate?: number;
      latencyMs?: number;
    };
  }>;
  
  // Enable hybrid mode (HTTP + microservice)
  hybrid?: boolean;
}
```

### Plugin Methods

When you use the plugin, your Elysia app gets these methods:

```typescript
// Lifecycle
app.microservice.start()         // Manually start microservice
app.microservice.stop()          // Stop microservice
app.microservice.awaitReady()    // Wait until ready
app.microservice.health()        // Check if healthy
app.microservice.ready()         // Check if ready
app.microservice.registry        // Access the registry
app.microservice.server          // Access the server
app.microservice.clients         // Access clients
app.microservice.clientProxy(name, schema) // Create typed client

// Handlers
app.onMsMessage(pattern, handler) // Register message handler
app.onMsEvent(pattern, handler)   // Register event handler

// Guards & Middleware (DI System)
app.msGuard(guard)               // Add global guard
app.msMiddleware(middleware)      // Add global middleware
app.msGroup(prefix)              // Create scoped group (returns builder)
  .msGuard(guard)                // Add group guard
  .msMiddleware(middleware)      // Add group middleware
```

## Guards & Middleware

Use the hierarchical DI system for authorization, validation, and cross-cutting concerns:

### Global Guard (Authentication)

```typescript
app.msGuard(async (ctx) => {
  const token = (ctx.meta as any)?.token;
  if (!token || !isValidToken(token)) {
    throw new Error('Unauthorized');
  }
});
```

### Global Middleware (Request Enrichment)

```typescript
app.msMiddleware({
  onBefore: async (ctx) => {
    const user = await decodeToken((ctx.meta as any)?.token);
    return { user, userId: user?.id };
  },
  onAfter: async (ctx, response) => {
    console.log(`[${(ctx as any).userId}] ${ctx.pattern} completed`);
  }
});
```

### Group Scopes (Role-Based Access)

```typescript
// Protect all admin.* patterns
const adminGroup = app.msGroup('admin.*');
adminGroup.msGuard(async (ctx) => {
  const role = (ctx.meta as any)?.role;
  if (role !== 'admin') {
    throw new Error('Forbidden: Admin only');
  }
});

// Protect all users.* patterns
const userGroup = app.msGroup('users.*');
userGroup.msGuard(async (ctx) => {
  const role = (ctx.meta as any)?.role;
  if (!['admin', 'user'].includes(role)) {
    throw new Error('Forbidden: Invalid role');
  }
});
```

### Passing Metadata

Metadata flows through guards, middleware, and handlers:

```typescript
// Client sends metadata
const result = await client.send(
  'users.get',
  { id: 1 },
  { meta: { token: 'jwt-token', role: 'admin' } }
);

// Server receives it in guards/middleware/handlers
.msGuard(async (ctx) => {
  console.log('Guard sees:', ctx.meta); // { token, role }
})
.onMsMessage('users.get', (ctx) => {
  console.log('Handler sees:', ctx.meta);
  return { id: 1 };
});
```

**See [Advanced Features](../../docs/guides/advanced-features.md#guards--middleware-di-system) for more details and patterns.**

## With Clients

```typescript
const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } },
    clients: {
      userService: {
        transport: 'tcp',
        options: { host: '127.0.0.1', port: 4001 }
      }
    }
  }))
  .onMsMessage('get.profile', async (data) => {
    // Use another microservice
    const user = await app.microservice.clients.userService.send('get.user', { id: data.userId });
    return { ...user, profile: 'data' };
  });

await app.microservice.start();
```

## More Examples

See the main [README](../../README.md) for more examples and documentation.
