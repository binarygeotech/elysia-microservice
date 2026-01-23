# @elysia-microservice/adapters

Adapters for integrating Elysia microservices with other frameworks.

## Features

- **NestJS Adapter**: Use NestJS-style decorators (`@MessagePattern`, `@EventPattern`) with Elysia microservices
- **Parameter Decorators**: Extract payload and context data with `@Payload()` and `@Ctx()`
- **Plugin-style loading**: Declare adapters in microservice config for centralized initialization

## Installation

```bash
bun add @elysia-microservice/adapters
```

## Usage

### Declarative Adapter Configuration

Configure adapters when creating your Microservice plugin:

```typescript
import Elysia from 'elysia';
import { Microservice } from '@elysia-microservice/core';
import { NestAdapter } from '@elysia-microservice/adapters';
import { MessagePattern, EventPattern, Payload, Ctx } from '@elysia-microservice/core';
import type { MicroserviceContext } from '@elysia-microservice/core';

class UserController {
  @MessagePattern('get.user')
  async getUser(@Payload() data: { id: number }) {
    return { id: data.id, name: 'John' };
  }

  @EventPattern('user.created')
  handleUserCreated(@Payload() data: { id: number }) {
    console.log('User created:', data.id);
  }
}

const app = new Elysia()
  .use(Microservice({
    hybrid: true,
    server: { transport: 'tcp', options: { port: 7000 } },
    adapters: [
      {
        class: NestAdapter,
        initializer: (adapter, registry) => {
          const controller = new UserController();
          adapter.init(registry, controller);
        }
      }
    ]
  }))
  .listen(8000);
```

### NestJS Adapter Decorators

#### Message Pattern (Request/Response)

```typescript
class MathController {
  @MessagePattern('sum.numbers')
  accumulate(@Payload() data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }
}
```

#### Event Pattern (Fire & Forget)

```typescript
class NotificationController {
  @EventPattern('user.registered')
  onUserRegistered(@Payload() data: { email: string }): void {
    console.log(`Sending welcome email to ${data.email}`);
  }
}
```

### Parameter Decorators

#### @Payload() - Extract Message Data

```typescript
class OrderController {
  // Extract entire payload
  @MessagePattern('order.create')
  createOrder(@Payload() order: { items: any[]; total: number }) {
    return { orderId: '123', status: 'created' };
  }

  // Extract specific property
  @MessagePattern('order.get')
  getOrder(@Payload('id') orderId: string) {
    return { id: orderId, status: 'pending' };
  }
}
```

#### @Ctx() - Access Microservice Context

```typescript
class AuthController {
  @MessagePattern('auth.verify')
  verifyToken(
    @Payload() token: string,
    @Ctx() context: MicroserviceContext
  ) {
    console.log(`[${context.traceId}] Verifying token`);
    return { valid: true, userId: context.auth?.userId };
  }
}
```

#### @App() - Access Elysia App Context

```typescript
class AuthController {
  @MessagePattern('auth.verify')
  verifyToken(
    @Payload() token: string,
    @Ctx() context: MicroserviceContext,
    @App() app: ElysiaInstance,
  ) {
    console.log(`[${context.traceId}] Verifying token`);
    console.log(`[${app.store}] - Elysia instance store`)
    return { valid: true, userId: context.auth?.userId };
  }
}
```

### Pattern Types

Patterns support multiple formats:

```typescript
class RequestHandler {
  // Exact match
  @MessagePattern('user.get')
  getUser(@Payload() data: { id: number }) { }

  // Wildcard: matches user.*, e.g., user.get, user.create, user.delete
  @MessagePattern('user.*')
  handleUserEvent(@Payload() data: any) { }

  // Regex: matches specific patterns like order.123, order.456, etc.
  @MessagePattern(/^order\.\d+$/)
  getOrder(@Payload() data: any) { }
}
```

### Return Types

Handlers can return plain values, Promises, or Observables:

```typescript
import { from, Observable } from 'rxjs';

class DataController {
  // Synchronous
  @MessagePattern('sum')
  add(@Payload() nums: number[]): number {
    return nums.reduce((a, b) => a + b, 0);
  }

  // Asynchronous
  @MessagePattern('fetch.user')
  async getUser(@Payload() id: number): Promise<{ id: number; name: string }> {
    const user = await db.users.findOne(id);
    return user;
  }

  // Observable (emits multiple responses)
  @MessagePattern('stream.data')
  streamData(): Observable<number> {
    return from([1, 2, 3, 4, 5]);
  }
}
```

### Event Handlers with Observables

Event handlers can also return Observables for reactive event processing:

```typescript
import { interval, Subject } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';

class EventStreamController {
  // Process events over time with Observable
  @EventPattern('monitor.system')
  monitorSystem(@Payload() data: any) {
    console.log('Starting system monitoring for:', data.service);
    
    // Return Observable that processes the event over time
    return interval(1000).pipe(
      take(5),
      map(i => {
        console.log(`Health check ${i + 1}/5 for ${data.service}`);
        // Side effects happen for each emission
        return { tick: i + 1, service: data.service };
      })
    );
  }

  // One-time event processing
  @EventPattern('user.login')
  onUserLogin(@Payload() data: { userId: string }) {
    console.log(`User ${data.userId} logged in`);
    // Events don't return values to caller, but can perform async work
  }
}
```

#### Creating Event Observables

You can create Observable streams to subscribe to events programmatically:

```typescript
import { Observable } from 'rxjs';

// Helper function to create event Observable
function observeEvent<T = any>(
  registry: any,
  pattern: string
): Observable<{ data: T; ctx: MicroserviceContext }> {
  return new Observable(subscriber => {
    // Register event handler that pushes to Observable
    const handler = (ctx: any) => {
      subscriber.next({ 
        data: ctx.data, 
        ctx: ctx.meta || ctx 
      });
    };
    
    registry.registerEvent(pattern, handler);
    
    // Cleanup (if unregister is implemented)
    return () => {
      // registry.unregisterEvent(pattern, handler);
    };
  });
}

// Usage in your application
const app = new Elysia().use(Microservice({ /* config */ }));

// Subscribe to user events
const userEvents$ = observeEvent(app.microservice.registry, 'user.*');
userEvents$.subscribe(({ data, ctx }) => {
  console.log('User event received:', data);
  console.log('Trace ID:', ctx.traceId);
});

// Subscribe with operators
import { filter, debounceTime } from 'rxjs/operators';

const importantEvents$ = observeEvent(app.microservice.registry, 'system.*').pipe(
  filter(({ data }) => data.priority === 'high'),
  debounceTime(1000)
);

importantEvents$.subscribe(({ data }) => {
  console.log('High priority event:', data);
});
```

#### Event Stream with Subject

For more control, use RxJS Subject to create event streams:

```typescript
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

class EventBus {
  private eventStream$ = new Subject<{ 
    pattern: string; 
    data: any; 
    ctx: MicroserviceContext 
  }>();

  // Wildcard handler captures all events
  @EventPattern('*')
  captureAll(@Payload() data: any, @Ctx() ctx: MicroserviceContext) {
    // Note: This requires catchall event support
    // For specific patterns, create multiple handlers
  }

  // Expose filtered streams
  getUserEvents() {
    return this.eventStream$.pipe(
      filter(event => event.pattern.startsWith('user.'))
    );
  }

  getOrderEvents() {
    return this.eventStream$.pipe(
      filter(event => event.pattern.startsWith('order.')),
      map(event => ({ ...event.data, timestamp: Date.now() }))
    );
  }
}

// Subscribe to specific event types
const eventBus = new EventBus();
eventBus.getUserEvents().subscribe(event => {
  console.log('User event:', event);
});
```


