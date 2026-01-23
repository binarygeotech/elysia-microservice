<div align="center">

# Elysia Microservice Framework

<p>
  <strong>A modular, transport-agnostic microservices framework for <a href="https://elysiajs.com/">Elysia</a></strong>
</p>

<p>
  <a href="https://www.npmjs.com/package/@elysia-microservice/core"><img src="https://img.shields.io/npm/v/@elysia-microservice/core.svg" alt="npm version"></a>
  <a href="https://github.com/binarygeotech/elysia-microservice/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/binarygeotech/elysia-microservice/stargazers"><img src="https://img.shields.io/github/stars/binarygeotech/elysia-microservice.svg" alt="GitHub stars"></a>
  <a href="CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg" alt="Contributor Covenant"></a>
</p>

<p>
  <strong>Build production-ready microservices with Elysia's speed and simplicity</strong>
</p>

</div>

---

## ✨ Features

- 🔌 **Plugin Mode** - Seamless integration with Elysia (HTTP + Microservice)
- ⚡ **Standalone Mode** - Pure microservice applications without HTTP
- 🎯 **Advanced Pattern Matching** - Wildcards (`user.*`), regex, and catchall handlers
- 🔀 **Transport Agnostic** - Support for TCP, TLS, NATS, Redis, and Kafka
- 📦 **Modular** - Install only what you need, tree-shakable bundles
- 🔄 **Service Discovery** - Static and DNS-based service discovery
- ⚖️ **Load Balancing** - Round-robin with failure tracking
- 🛡️ **Resilience** - Circuit breaker, retries, and timeouts
- 🎭 **Chaos Engineering** - Inject failures and latency for testing
- 🔗 **NestJS Compatible** - Use NestJS decorators with Elysia
- 🧩 **Parameter Decorators** - `@Payload()`, `@Ctx()`, and `@App()` for handler injection
- 📊 **Connection Pooling** - Automatic client pooling with failover
- 🪝 **Lifecycle Hooks** - onBefore/onAfter hooks for cross-cutting concerns
- 🏥 **Health Checks** - Built-in health and readiness endpoints (hybrid mode)
- 📝 **TypeScript First** - Full type safety with excellent IntelliSense

---

## 📚 Documentation

- **[Getting Started](docs/guides/getting-started.md)** - Quick start guide for new users
- **[Pattern Matching](docs/guides/PATTERN_MATCHING.md)** - Wildcards, regex, and catchall handlers
- **[Advanced Features](docs/guides/advanced-features.md)** - Hooks, error handling, resilience patterns
- **[API Reference](docs/api/core.md)** - Complete API documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System design and architecture
- **[Migration Guide](docs/MIGRATION.md)** - Upgrading from previous versions
- **[Changelog](CHANGELOG.md)** - Version history and release notes
- **[Contributing](CONTRIBUTING.md)** - How to contribute to this project
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community guidelines

---

## 📦 Packages

This monorepo contains the following packages:

### Core
- **[@elysia-microservice/core](./packages/core)** - Core functionality (registry, protocol, patterns, context)

### Utilities
- **[@elysia-microservice/utils](./packages/utils)** - Service discovery, load balancing, client pooling, chaos engineering

### Transport Servers
- **[@elysia-microservice/transport-tcp](./packages/transport-tcp)** - TCP transport server
- **[@elysia-microservice/transport-tls](./packages/transport-tls)** - TLS/SSL transport server
- **[@elysia-microservice/transport-nats](./packages/transport-nats)** - NATS transport server
- **[@elysia-microservice/transport-redis](./packages/transport-redis)** - Redis transport server
- **[@elysia-microservice/transport-kafka](./packages/transport-kafka)** - Kafka transport server

### Clients
- **[@elysia-microservice/client-tcp](./packages/client-tcp)** - TCP client
- **[@elysia-microservice/client-tls](./packages/client-tls)** - TLS/SSL client
- **[@elysia-microservice/client-nats](./packages/client-nats)** - NATS client
- **[@elysia-microservice/client-redis](./packages/client-redis)** - Redis client
- **[@elysia-microservice/client-kafka](./packages/client-kafka)** - Kafka client
- **[@elysia-microservice/client-base](./packages/client-base)** - Client factory, proxy, and resilience

### Adapters
- **[@elysia-microservice/adapters](./packages/adapters)** - Framework adapters (NestJS compatibility)

---

## 🚀 Quick Start

### Installation

```bash
# Core + TCP transport (simplest setup)
bun add @elysia-microservice/core @elysia-microservice/transport-tcp @elysia-microservice/client-tcp elysia
```

### Your First Microservice

**server.ts**
```typescript
import { Elysia } from 'elysia';
import { Microservice } from '@elysia-microservice/core';

const app = new Elysia()
  .use(Microservice({ 
    server: { transport: 'tcp', options: { port: 4000 } },
    hybrid: true
  }))
  .onMsMessage('user.get', async (ctx) => {
    return { id: ctx.data.id, name: 'John Doe' };
  })
  .onMsEvent('user.created', (ctx) => {
    console.log('User created:', ctx.data);
  })
  .get('/', () => 'Hello HTTP!')
  .listen(3000);

console.log('🚀 HTTP: http://localhost:3000');
console.log('🔌 Microservice: tcp://localhost:4000');
```

**client.ts**
```typescript
import { createTcpClient } from '@elysia-microservice/client-tcp';

const client = createTcpClient({ host: '127.0.0.1', port: 4000 });

// Request/response
const user = await client.send('user.get', { id: 1 });
console.log(user); // { id: 1, name: 'John Doe' }

// Fire-and-forget event
await client.emit('user.created', { id: 2, name: 'Jane' });

await client.close();
```

**👉 [Read the full Getting Started Guide](docs/guides/getting-started.md)**

---

## 🎯 Key Concepts

### Messages vs Events

**Messages** (Request/Response):
- Client waits for response
- Use `.onMsMessage()` on server, `.send()` on client
- For queries and commands needing confirmation

**Events** (Fire-and-Forget):
- Client doesn't wait for response
- Use `.onMsEvent()` on server, `.emit()` on client
- For notifications and side effects

### Pattern Matching

```typescript
// Exact match
.onMsMessage('user.get', handler)

// Wildcard - matches user.create, user.update, etc.
.onMsMessage('user.*', handler)

// Regex - matches user.create or user.update only
.onMsMessage(/^user\.(create|update)$/, handler)

// Catchall - handles unmatched patterns
.onMsCatchallMessage((pattern, data) => {
  return { error: 'Pattern not found' };
})
```

**[Learn more about Pattern Matching →](docs/guides/PATTERN_MATCHING.md)**

### MessageContext

All handlers receive a structured context:

```typescript
.onMsMessage('user.*', (ctx) => {
  console.log(ctx.pattern);  // Matched pattern: "user.create"
  console.log(ctx.data);     // Payload: { name: "John" }
  console.log(ctx.meta);     // Transport metadata
  return { success: true };
})
```

---

## 🧭 NestJS-Style Decorators (Adapters)

### Microservice options (including adapters)

```typescript
const app = new Elysia()
  .use(Microservice({
    hybrid: true,
    server: { transport: 'tcp', options: { port: 4000 } },
    clients: {},
    adapters: [
      {
        class: NestAdapter,
        initializer: (adapter, registry) => {
          adapter.init(registry, new UserController());
        },
      },
    ],
  }));
```

Adapters let you register controller classes once, each adapter can optionally receive an `initializer` to wire controllers.

Use the Nest adapter with familiar method decorators and parameter injections:
- Method decorators: `@MessagePattern()` (request/response), `@EventPattern()` (fire-and-forget)
- Parameter decorators: `@Payload()`, `@Ctx()`, `@App()`

```typescript
import { MessagePattern, EventPattern, Payload, Ctx, App } from '@elysia-microservice/core';
import type { MicroserviceContext } from '@elysia-microservice/core';
import type { ElysiaInstance } from 'elysia';
import { from, Observable } from 'rxjs';

class UserController {
  @MessagePattern('user.get')
  getUser(
    @Payload('id') id: number,
    @Ctx() ctx: MicroserviceContext,
    @App() app: ElysiaInstance
  ) {
    app.log?.info?.(`Request trace: ${ctx.traceId}`);
    return { id, name: 'John Doe' };
  }

  // Event handler can also return an Observable stream
  @EventPattern('user.activity')
  activityStream(): Observable<number> {
    return from([1, 2, 3]);
  }
}
```


## 🔌 Supported Transports

### TCP (Simple & Fast)

```bash
bun add @elysia-microservice/transport-tcp @elysia-microservice/client-tcp
```

### TLS (Secure TCP)

```bash
bun add @elysia-microservice/transport-tls @elysia-microservice/client-tls
```

### NATS (Message Broker)

```bash
bun add @elysia-microservice/transport-nats @elysia-microservice/client-nats nats
```

### Redis (Pub/Sub)

```bash
bun add @elysia-microservice/transport-redis @elysia-microservice/client-redis redis
```

### Kafka (Event Streaming)

```bash
bun add @elysia-microservice/transport-kafka @elysia-microservice/client-kafka kafkajs
```

---

## 🛠️ Development

### Build All Packages

```bash
cd base
bun install
make build
```

### Using Makefile

```bash
# Show all available commands
make help

# Build packages
make build              # Build all packages
make rebuild            # Clean and rebuild

# Run tests
make test              # All tests
make test-unit         # Unit tests only
make quick-test        # Fast unit tests (no build)

# Development
make dev               # Watch mode
make check             # Quick validation (build + test + lint)
make validate          # Full validation (clean + install + build + test)

# Publishing (maintainers only)
make version VERSION=0.2.0  # Update version
make publish-dry            # Test publish
make publish                # Publish to npm
```

### Run Tests

```bash
make test              # All tests
make test-unit         # Unit tests only
make test-integration  # Integration tests
```

### Clean Build Artifacts

```bash
make clean
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with tests
4. Commit your changes (`git commit -m 'feat(core): add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- [Elysia](https://elysiajs.com/) - The web framework we build on
- [Bun](https://bun.sh/) - The JavaScript runtime we recommend
- [Documentation](docs/) - Full documentation
- [Examples](examples/) - Example applications
- [GitHub Issues](https://github.com/binarygeotech/elysia-microservice/issues) - Report bugs or request features
- [GitHub Discussions](https://github.com/binarygeotech/elysia-microservice/discussions) - Ask questions and share ideas

---

<div align="center">

**Built with ❤️ using [Elysia](https://elysiajs.com/) and [Bun](https://bun.sh/)**

</div>
