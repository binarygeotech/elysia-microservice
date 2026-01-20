# Pattern Matching Guide

The Elysia Microservice framework supports flexible pattern matching for message and event handlers, allowing you to handle groups of patterns with a single handler or catch unmatched patterns.

## Pattern Types

### 1. Exact Match (Highest Priority)

Matches patterns exactly as specified.

```typescript
app
  .onMsMessage("auth.login", ({ data }) => {
    return { success: true, user: data.username };
  })
  .onMsEvent("user.logout", ({ data }) => {
    console.log("User logged out:", data.userId);
  });
```

**Use cases:**
- Specific operations that need dedicated handling
- Performance-critical paths (exact matches are fastest)
- When you need different logic for each pattern

### 2. Wildcard Patterns

Use `*` to match any characters in that position. Wildcards are converted to regex patterns internally.

```typescript
app
  .onMsMessage("users.*", ({ data, pattern }) => {
    // Handles: users.created, users.updated, users.deleted, etc.
    console.log(`User operation: ${pattern}`);
    return { success: true, operation: pattern };
  })
  .onMsEvent("notifications.*", ({ data, pattern }) => {
    // Handles: notifications.email, notifications.push, notifications.sms
    console.log(`Notification: ${pattern}`, data);
  });
```

**Wildcard rules:**
- `*` matches any characters except dots
- `users.*` matches `users.created` but NOT `users.profile.updated`
- Use multiple wildcards: `users.*.events.*`

**Use cases:**
- Handling related operations with similar logic
- Implementing generic CRUD handlers
- Routing events to common processing logic

### 3. Regex Patterns

Use regex patterns for complex matching. Format: `/pattern/flags`

```typescript
app
  .onMsMessage("/^order\\.[0-9]+$/", ({ data, pattern }) => {
    // Matches: order.123, order.456, order.7890
    const orderId = pattern.split('.')[1];
    return { orderId, status: "processed" };
  })
  .onMsEvent("/^analytics\\.(pageview|click|scroll)/i", ({ data, pattern }) => {
    // Matches: analytics.pageview, analytics.CLICK, analytics.Scroll (case-insensitive)
    console.log("Analytics event:", pattern);
  });
```

**Regex rules:**
- Must start with `/` and contain at least one more `/`
- Format: `/pattern/flags` (flags are optional)
- Use `\\` to escape special characters
- Supports all JavaScript regex features

**Use cases:**
- Matching patterns with numeric IDs
- Case-insensitive matching
- Complex validation rules
- Dynamic pattern segments

### 4. Catchall Handlers (Lowest Priority)

Handles patterns that don't match any registered handler. Prevents silent failures.

```typescript
app
  .onMsCatchallMessage((pattern, data) => {
    console.warn(`Unhandled message: ${pattern}`);
    return { 
      error: `No handler for ${pattern}`,
      suggestion: "Check available patterns" 
    };
  })
  .onMsCatchallEvent((pattern, data) => {
    console.warn(`Unhandled event: ${pattern}`);
  });
```

**Use cases:**
- Debugging during development
- Monitoring production systems for misconfigured clients
- Providing helpful error messages
- Logging unhandled patterns for analysis

## Pattern Matching Order

The registry checks patterns in this order:

```
1. Exact match (fastest)
   ↓ no match
2. Wildcard patterns (in registration order)
   ↓ no match
3. Regex patterns (in registration order)
   ↓ no match
4. Catchall handler
   ↓ no match
5. Silent failure (no handler)
```

## Handler Signatures

### Message Handlers (Request/Response)

```typescript
type MessageHandler = (context: {
  data: any;           // The message payload
  pattern: string;     // The actual pattern that was called
  ctx?: any;          // Transport-specific context
}) => any | Promise<any>;

// Catchall message handler
type CatchallMessageHandler = (
  pattern: string,     // The pattern that wasn't matched
  data: any,          // The message payload
  ctx?: any           // Transport-specific context
) => any | Promise<any>;
```

### Event Handlers (Fire and Forget)

```typescript
type EventHandler = (context: {
  data: any;           // The event payload
  pattern: string;     // The actual pattern that was called
  ctx?: any;          // Transport-specific context
}) => void | Promise<void>;

// Catchall event handler
type CatchallEventHandler = (
  pattern: string,     // The pattern that wasn't matched
  data: any,          // The event payload
  ctx?: any           // Transport-specific context
) => void | Promise<void>;
```

## Complete Example

```typescript
import { Elysia } from "elysia";
import { Microservice } from "@elysia-microservice/core";

const app = new Elysia()
  .use(Microservice({ transport: "tcp", port: 4000 }))
  
  // Exact matches
  .onMsMessage("auth.login", ({ data }) => {
    return { token: "jwt-token", userId: data.username };
  })
  .onMsMessage("auth.logout", ({ data }) => {
    return { success: true };
  })
  
  // Wildcard patterns
  .onMsMessage("users.*", ({ data, pattern }) => {
    const operation = pattern.split('.')[1]; // created, updated, deleted
    return { 
      operation, 
      userId: data.userId,
      timestamp: Date.now() 
    };
  })
  
  // Regex patterns
  .onMsMessage("/^product\\.[0-9]+$/", ({ data, pattern }) => {
    const productId = pattern.split('.')[1];
    return { 
      productId, 
      data,
      processed: true 
    };
  })
  
  // Event patterns
  .onMsEvent("notifications.*", ({ data, pattern }) => {
    // Send notification via appropriate channel
    const channel = pattern.split('.')[1];
    console.log(`Sending ${channel} notification:`, data);
  })
  
  // Catchall handlers
  .onMsCatchallMessage((pattern, data) => {
    console.warn(`⚠️ Unhandled message: ${pattern}`, data);
    return { 
      error: "Pattern not found",
      pattern,
      availablePatterns: [
        "auth.login",
        "auth.logout", 
        "users.*",
        "/^product\\.[0-9]+$/"
      ]
    };
  })
  .onMsCatchallEvent((pattern, data) => {
    console.warn(`⚠️ Unhandled event: ${pattern}`, data);
  })
  
  .listen(3000);
```

## Best Practices

### 1. Order Your Patterns

Register patterns from most specific to most general:

```typescript
app
  .onMsMessage("users.admin.login", handler1)      // Most specific
  .onMsMessage("users.admin.*", handler2)          // Less specific
  .onMsMessage("users.*", handler3)                // Most general
  .onMsCatchallMessage(catchall);                  // Fallback
```

### 2. Use Exact Matches for Hot Paths

Exact matches are faster than pattern matching:

```typescript
// ✅ Good - fast exact match
app.onMsMessage("auth.login", handler);

// ⚠️ Less efficient if called frequently
app.onMsMessage("auth.*", handler);
```

### 3. Document Your Patterns

Use comments or create a pattern registry:

```typescript
/**
 * Message Patterns:
 * - auth.login: User authentication
 * - auth.logout: User logout
 * - users.*: User CRUD operations
 * - /^order\\.[0-9]+$/: Order processing by ID
 */
```

### 4. Always Add Catchall Handlers

Prevent silent failures in production:

```typescript
app
  .onMsCatchallMessage((pattern, data) => {
    // Log to monitoring system
    logger.warn("Unhandled pattern", { pattern, data });
    return { error: "Pattern not found" };
  });
```

### 5. Test Your Patterns

Create tests for all pattern types:

```typescript
import { test, expect } from "bun:test";

test("wildcard pattern matches correctly", async () => {
  const result = await client.send("users.created", { id: 123 });
  expect(result.operation).toBe("created");
});

test("regex pattern matches order IDs", async () => {
  const result = await client.send("order.123", { items: [] });
  expect(result.orderId).toBe("123");
});

test("catchall handles unknown patterns", async () => {
  const result = await client.send("unknown.pattern", {});
  expect(result.error).toBeDefined();
});
```

## Performance Considerations

### Pattern Matching Speed

1. **Exact match**: O(1) - HashMap lookup
2. **Wildcard**: O(n) - Iterates through registered patterns
3. **Regex**: O(n) - Iterates through registered patterns
4. **Catchall**: O(1) - Direct reference

### Optimization Tips

- Use exact matches for frequently called patterns
- Limit the number of wildcard/regex patterns
- Consider splitting services if you have too many patterns
- Cache compiled regex patterns (done automatically)

## Transport-Specific Behavior

### TCP/TLS Transports

Pattern matching happens on the server side when a message is received.

### NATS Transport

NATS has built-in wildcard support (`*` and `>`). The framework's pattern matching works on top of NATS patterns.

```typescript
// NATS subscription: "users.*"
// Framework pattern matching: exact, wildcard, regex, catchall
```

### Redis Transport

Redis pub/sub supports pattern subscriptions. Framework pattern matching provides additional flexibility.

### Kafka Transport

Kafka uses topics (exact match). Framework pattern matching allows one consumer to handle multiple topics with patterns.

## Troubleshooting

### Pattern Not Matching

**Problem**: Your pattern isn't being matched.

**Solution**: Check the registration order and pattern syntax:

```typescript
// ❌ Wrong - regex needs to be a string
app.onMsMessage(/^users\./);

// ✅ Correct - regex as string with slashes
app.onMsMessage("/^users\\./");
```

### Multiple Patterns Match

**Problem**: Multiple patterns could match your message.

**Solution**: Only the first matching pattern is used. Order matters!

```typescript
// users.created matches BOTH patterns, but handler1 is used
app
  .onMsMessage("users.created", handler1)  // ✅ Matches first
  .onMsMessage("users.*", handler2);       // Skipped
```

### Catchall Not Called

**Problem**: Catchall handler isn't being invoked.

**Solution**: Ensure no other pattern matches, and the catchall is registered:

```typescript
// Check that catchall is actually registered
app.onMsCatchallMessage((pattern, data) => {
  console.log("Catchall:", pattern);
  return { error: "Not found" };
});
```

## Migration Guide

### From Exact Matches Only

Before:
```typescript
app
  .onMsMessage("users.create", handler)
  .onMsMessage("users.update", handler)
  .onMsMessage("users.delete", handler);
```

After:
```typescript
app.onMsMessage("users.*", ({ pattern, data }) => {
  const operation = pattern.split('.')[1];
  return handler(operation, data);
});
```

### Adding Catchall Handlers

Before:
```typescript
// Silent failures if pattern doesn't exist
app.onMsMessage("users.create", handler);
```

After:
```typescript
app
  .onMsMessage("users.create", handler)
  .onMsCatchallMessage((pattern, data) => {
    console.warn(`No handler for: ${pattern}`);
    return { error: "Pattern not found", pattern };
  });
```

## See Also

- [Examples](../examples/src/pattern-matching-server.ts)
- [API Reference](./API.md)
- [Transport Guide](./TRANSPORTS.md)
