# Elysia Microservice Examples

This directory contains practical examples for using the Elysia microservice framework.

## Running the Examples

### Prerequisites

```bash
# Install dependencies from the root
cd ..
bun install

# Build all packages
bun run build
```

### 1. Standalone Server + Client

Terminal 1 - Start the server:
```bash
bun run examples/standalone-server.ts
```

Terminal 2 - Run the client:
```bash
bun run examples/tcp-client.ts
```

### 2. Hybrid Server

Run HTTP + Microservice in one application:
```bash
bun run examples/hybrid-server.ts
```

Then:
- Visit http://localhost:3000 in your browser
- Check health: http://localhost:3000/health
- Use the TCP client to send microservice messages to port 4000

### 3. Pattern Matching

Terminal 1 - Start the pattern matching server:
```bash
bun run examples/pattern-matching-server.ts
```

Terminal 2 - Run the pattern matching client:
```bash
bun run examples/pattern-matching-client.ts
```

This example demonstrates:
- Exact pattern matching (`auth.login`)
- Wildcard patterns (`users.*` matches `users.created`, `users.updated`, etc.)
- Regex patterns (`/^order\.[0-9]+$/` matches `order.123`, `order.456`, etc.)
- Catchall handlers for unmatched patterns

## Example Descriptions

### `standalone-server.ts`
A pure microservice server without HTTP. Demonstrates:
- Message patterns (request/response)
- Event patterns (fire-and-forget)
- Manual startup control

### `tcp-client.ts`
A TCP client that connects to the standalone server. Demonstrates:
- Sending messages and receiving responses
- Emitting events
- Error handling and cleanup

### `hybrid-server.ts`
A hybrid application with both HTTP and microservice capabilities. Demonstrates:
- Running HTTP routes and microservice patterns together
- Health check endpoints
- Plugin mode with `hybrid: true`

### `pattern-matching-server.ts`
Advanced pattern matching capabilities. Demonstrates:
- Exact pattern matching (highest priority)
- Wildcard patterns (`users.*`, `notifications.*`)
- Regex patterns (`/^order\.[0-9]+$/`)
- Catchall handlers to prevent silent failures
- Pattern matching order and priority

### `pattern-matching-client.ts`
Client that tests all pattern matching features. Demonstrates:
- Testing exact matches
- Testing wildcard patterns with multiple variations
- Testing regex patterns with dynamic IDs
- Testing catchall behavior with unknown patterns
- Event pattern matching

See [PATTERN_MATCHING.md](../PATTERN_MATCHING.md) for a complete guide.

## Next Steps

- Explore different transports (NATS, Redis, Kafka)
- Add service discovery and load balancing
- Implement resilience patterns (retries, circuit breakers)
- See the [main README](../README.md) for more advanced examples
