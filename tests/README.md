# Integration Tests

This directory contains integration tests that test the entire microservice ecosystem across all packages.

## Current Status

⚠️ **Note**: Integration tests require all packages to be properly built and their dependencies resolved. Currently, these tests use relative imports from built packages (`../packages/*/dist/*.js`) which can have dependency resolution challenges in a monorepo before publishing.

**Recommended Approach:**
- **Unit tests** in `packages/*/tests/` work perfectly and test package internals
- **Integration tests** here work best after packages are published to npm
- Alternatively, use a tool like `yalc` or `npm link` to simulate published packages locally

## Structure

- `plugin.test.ts` - Tests for the Microservice plugin (standalone and hybrid modes)
- `transports.test.ts` - Tests for different transport implementations (TCP, TLS, etc.)
- Future: `multi-client.test.ts`, `resilience.test.ts`, `discovery.test.ts`, etc.

## Why at the Root Level?

Integration tests are placed at the root level (not in individual packages) because:

1. **Cross-Package Testing** - They test interactions between multiple packages
2. **Direct Imports** - Can use `@elysia-microservice/*` imports directly from workspace
3. **Real-World Scenarios** - Test how users will actually use the packages together
4. **Ecosystem Validation** - Ensure all packages work correctly together

## Running Tests

```bash
# Run all integration tests
bun test

# Run specific test file
bun test tests/plugin.test.ts

# Run with coverage
bun test --coverage
```

## Unit Tests vs Integration Tests

### Unit Tests (in packages/*/tests/)
- Test individual package functionality
- Use internal imports (e.g., `../src/registry`)
- Fast, isolated, no external dependencies
- Example: `packages/core/tests/core.test.ts`

### Integration Tests (in tests/)
- Test multiple packages working together
- Use workspace imports (e.g., `@elysia-microservice/core`)
- May require running servers, external services
- Example: `tests/plugin.test.ts`

## Test Requirements

Some tests may require external services to be running:

### NATS Tests
```bash
docker run -p 4222:4222 nats:latest
```

### Redis Tests
```bash
docker run -p 6379:6379 redis:latest
```

### Kafka Tests
```bash
docker-compose up -d kafka zookeeper
```

### TLS Tests
Generate test certificates:
```bash
./generate_test_cert.sh
```

## Adding New Tests

When adding integration tests:

1. Create a new `.test.ts` file in this directory
2. Import packages using workspace aliases: `@elysia-microservice/*`
3. Use unique ports to avoid conflicts (4000-4999 range)
4. Clean up resources in `afterAll` hooks
5. Add timeouts for async operations
6. Skip tests that require external setup with `.skip()`

## Example Test Structure

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { Elysia } from "elysia";
import { Microservice } from "@elysia-microservice/core";
import { createTcpClient } from "@elysia-microservice/client-tcp";

describe("My Feature", () => {
  let app: any;
  let client: any;

  beforeAll(async () => {
    // Setup server
    app = new Elysia()
      .use(Microservice({ ... }))
      .onMsMessage("test", async (data) => ({ result: "ok" }));
    
    await app.microservice.start();
    await app.microservice.awaitReady();
    
    // Setup client
    client = createTcpClient({ port: 4XXX });
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // Cleanup
    await client?.close();
    await app?.microservice.stop();
  });

  it("should do something", async () => {
    const result = await client.send("test", {});
    expect(result).toEqual({ result: "ok" });
  });
});
```

## CI/CD Considerations

For CI environments:
- Use environment variables for external service URLs
- Provide docker-compose for required services
- Skip tests that require manual setup (use `.skip()` or environment checks)
- Set reasonable timeouts
- Clean up ports to avoid conflicts between test runs
