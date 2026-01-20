# Core API Reference

Complete API reference for `@elysia-microservice/core`.

## Registry

### `createRegistry()`

Creates a new registry for managing message and event handlers with pattern matching.

```typescript
function createRegistry(): Registry
```

**Returns:** A new `Registry` instance

**Example:**
```typescript
import { createRegistry } from '@elysia-microservice/core';

const registry = createRegistry();
```

---

### `Registry.registerMessage()`

Registers a request/response message handler with optional lifecycle hooks.

```typescript
registerMessage(
  pattern: string | RegExp,
  handler: (ctx: MessageContext) => MaybePromise<any>,
  hooks?: Hooks
): void
```

**Parameters:**
- `pattern` - Pattern to match (string, wildcard, or regex)
- `handler` - Handler function receiving MessageContext
- `hooks` - Optional lifecycle hooks (onBefore, onAfter)

**Example:**
```typescript
registry.registerMessage('user.get', async (ctx) => {
  return { id: ctx.data.id, name: 'John' };
}, {
  onBefore: async (ctx) => console.log('Before:', ctx.pattern),
  onAfter: async (ctx, result) => console.log('After:', result)
});
```

---

### `Registry.registerEvent()`

Registers a fire-and-forget event handler with optional lifecycle hooks.

```typescript
registerEvent(
  pattern: string | RegExp,
  handler: (ctx: MessageContext) => MaybePromise<void>,
  hooks?: Hooks
): void
```

**Parameters:**
- `pattern` - Pattern to match (string, wildcard, or regex)
- `handler` - Handler function receiving MessageContext
- `hooks` - Optional lifecycle hooks (onBefore, onAfter)

**Example:**
```typescript
registry.registerEvent('user.created', async (ctx) => {
  console.log('User created:', ctx.data);
  // Send email, update analytics, etc.
});
```

---

### `Registry.resolveAndRunRequest()`

Resolves a pattern to a message handler and executes it with lifecycle hooks.

```typescript
resolveAndRunRequest(
  pattern: string,
  data: any,
  context?: Partial<MessageContext>
): Promise<any>
```

**Parameters:**
- `pattern` - Pattern to match
- `data` - Message payload
- `context` - Optional additional context (meta, store)

**Returns:** Handler response

**Example:**
```typescript
const result = await registry.resolveAndRunRequest('user.get', { id: 1 });
```

---

### `Registry.resolveAndRunEvent()`

Resolves a pattern to an event handler and executes it with lifecycle hooks.

```typescript
resolveAndRunEvent(
  pattern: string,
  data: any,
  context?: Partial<MessageContext>
): Promise<void>
```

**Parameters:**
- `pattern` - Pattern to match
- `data` - Event payload
- `context` - Optional additional context (meta, store)

**Example:**
```typescript
await registry.resolveAndRunEvent('user.created', { id: 1, name: 'John' });
```

---

### `Registry.getRequestPatterns()`

Returns all registered request message patterns.

```typescript
getRequestPatterns(): string[]
```

**Returns:** Array of pattern strings

**Example:**
```typescript
const patterns = registry.getRequestPatterns();
console.log(patterns); // ['user.get', 'user.create', ...]
```

---

### `Registry.getEventPatterns()`

Returns all registered event patterns.

```typescript
getEventPatterns(): string[]
```

**Returns:** Array of pattern strings

**Example:**
```typescript
const patterns = registry.getEventPatterns();
console.log(patterns); // ['user.created', 'order.completed', ...]
```

---

### `Registry.setRequestHooks()`

Sets global lifecycle hooks for all request messages.

```typescript
setRequestHooks(hooks: Hooks): void
```

**Parameters:**
- `hooks` - Lifecycle hooks (onBefore, onAfter)

**Example:**
```typescript
registry.setRequestHooks({
  onBefore: async (ctx) => {
    console.log('[REQUEST]', ctx.pattern);
    ctx.store?.set('startTime', Date.now());
  },
  onAfter: async (ctx, result) => {
    const duration = Date.now() - ctx.store?.get('startTime');
    console.log('[RESPONSE]', ctx.pattern, duration, 'ms');
  }
});
```

---

### `Registry.setEventHooks()`

Sets global lifecycle hooks for all events.

```typescript
setEventHooks(hooks: Hooks): void
```

**Parameters:**
- `hooks` - Lifecycle hooks (onBefore, onAfter)

**Example:**
```typescript
registry.setEventHooks({
  onBefore: async (ctx) => console.log('[EVENT]', ctx.pattern),
  onAfter: async (ctx) => console.log('[EVENT PROCESSED]', ctx.pattern)
});
```

---

### `Registry.setRequestErrorHandler()`

Sets a global error handler for request messages.

```typescript
setRequestErrorHandler(
  handler: (error: Error, ctx: MessageContext) => MaybePromise<any>
): void
```

**Parameters:**
- `handler` - Error handler function

**Example:**
```typescript
registry.setRequestErrorHandler(async (error, ctx) => {
  console.error('[ERROR]', ctx.pattern, error);
  return { error: error.message };
});
```

---

### `Registry.setEventErrorHandler()`

Sets a global error handler for events.

```typescript
setEventErrorHandler(
  handler: (error: Error, ctx: MessageContext) => MaybePromise<void>
): void
```

**Parameters:**
- `handler` - Error handler function

**Example:**
```typescript
registry.setEventErrorHandler(async (error, ctx) => {
  console.error('[EVENT ERROR]', ctx.pattern, error);
  errorTracker.captureException(error, { pattern: ctx.pattern });
});
```

---

## Types

### `MessageContext`

Context object passed to all handlers.

```typescript
interface MessageContext {
  /** The matched pattern string */
  pattern: string;
  
  /** The message/event payload */
  data: any;
  
  /** Transport-specific metadata (optional) */
  meta?: any;
  
  /** Shared state map for hooks (optional) */
  store?: Map<any, any>;
  
  /** Original incoming pattern for catchalls */
  incoming?: string;
}
```

---

### `Hooks`

Lifecycle hooks for handlers.

```typescript
interface Hooks {
  /** Called before handler execution */
  onBefore?: (ctx: MessageContext) => MaybePromise<void>;
  
  /** Called after successful handler execution */
  onAfter?: (ctx: MessageContext, result?: any) => MaybePromise<void>;
}
```

---

### `MaybePromise<T>`

Value that may or may not be a Promise.

```typescript
type MaybePromise<T> = T | Promise<T>;
```

---

## Microservice Plugin

### `Microservice()`

Elysia plugin for adding microservice capabilities.

```typescript
function Microservice(config: MicroserviceConfig): ElysiaPlugin
```

**Parameters:**
- `config` - Microservice configuration

**Example:**
```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({
    server: {
      transport: 'tcp',
      options: { port: 4000 }
    },
    hybrid: true
  }));
```

---

### `MicroserviceConfig`

Configuration for the Microservice plugin.

```typescript
interface MicroserviceConfig {
  /** Server transport configuration */
  server: {
    transport: 'tcp' | 'tls' | 'nats' | 'redis' | 'kafka';
    options: Record<string, any>;
  };
  
  /** Enable hybrid mode (HTTP + Microservice) */
  hybrid?: boolean;
  
  /** Custom registry (optional) */
  registry?: Registry;
}
```

---

## Elysia Methods

When using the Microservice plugin, these methods are added to your Elysia app:

### `.onMsMessage()`

Register a request/response message handler.

```typescript
.onMsMessage(
  pattern: string | RegExp,
  handler: (ctx: MessageContext) => MaybePromise<any>
)
```

**Example:**
```typescript
app.onMsMessage('user.get', async (ctx) => {
  return { id: ctx.data.id, name: 'John' };
});
```

---

### `.onMsEvent()`

Register a fire-and-forget event handler.

```typescript
.onMsEvent(
  pattern: string | RegExp,
  handler: (ctx: MessageContext) => MaybePromise<void>
)
```

**Example:**
```typescript
app.onMsEvent('user.created', (ctx) => {
  console.log('User created:', ctx.data);
});
```

---

### `.onMsCatchallMessage()`

Register a catchall handler for unmatched request messages.

```typescript
.onMsCatchallMessage(
  handler: (pattern: string, data: any) => MaybePromise<any>
)
```

**Example:**
```typescript
app.onMsCatchallMessage((pattern, data) => {
  console.warn('No handler for:', pattern);
  return { error: 'Pattern not found' };
});
```

---

### `.onMsCatchallEvent()`

Register a catchall handler for unmatched events.

```typescript
.onMsCatchallEvent(
  handler: (pattern: string, data: any) => MaybePromise<void>
)
```

**Example:**
```typescript
app.onMsCatchallEvent((pattern, data) => {
  console.warn('No event handler for:', pattern);
});
```

---

## Pattern Matching

### Pattern Syntax

**Exact Match:**
```typescript
registry.registerMessage('user.get', handler);
// Matches: "user.get"
// Does NOT match: "user.create", "user.get.all"
```

**Wildcard (`*`):**
```typescript
registry.registerMessage('user.*', handler);
// Matches: "user.get", "user.create", "user.update"
// Does NOT match: "user.role.get" (doesn't match dots)
```

**Multi-level Wildcard (`**`):**
```typescript
registry.registerMessage('user.**', handler);
// Matches: "user.get", "user.role.get", "user.role.permission.view"
```

**Regex:**
```typescript
registry.registerMessage(/^user\.(get|create)$/, handler);
// Matches: "user.get", "user.create"
// Does NOT match: "user.update", "user.delete"
```

### Pattern Priority

More specific patterns are matched first:

1. **Exact matches** (highest priority)
2. **Regex patterns**
3. **Wildcard patterns**
4. **Catchall handlers** (lowest priority)

---

## See Also

- [Getting Started Guide](../guides/getting-started.md)
- [Pattern Matching Guide](../guides/PATTERN_MATCHING.md)
- [Advanced Features](../guides/advanced-features.md)
