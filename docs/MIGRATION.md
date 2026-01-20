# Migration Guide: Upgrading to Monorepo Structure

This guide helps you migrate to the new modular monorepo structure.

## Overview

The framework has been restructured into a modular monorepo with 14 separate packages. This allows you to install only what you need, resulting in smaller bundle sizes and better maintainability.

## What Changed?

The monolithic package has been split into 14 independent packages, organized by functionality:

### Package Mapping

| Original Location | New Package | Notes |
|------------------|-------------|-------|
| `src/registry.ts` | `@elysia-microservice/core` | Core registry system |
| `src/context.ts` | `@elysia-microservice/core` | Context management |
| `src/protocol/` | `@elysia-microservice/core` | Frame encoding/decoding |
| `src/patterns/` | `@elysia-microservice/core` | MessagePattern, EventPattern |
| `src/shutdown.ts` | `@elysia-microservice/core` | Graceful shutdown |
| `src/discovery/` | `@elysia-microservice/utils` | Service discovery |
| `src/loadbalancer/` | `@elysia-microservice/utils` | Load balancing |
| `src/client/pool.ts` | `@elysia-microservice/utils` | Client pooling |
| `src/chaos.ts` | `@elysia-microservice/utils` | Chaos engineering |
| `src/transport/tcp.ts` | `@elysia-microservice/transport-tcp` | TCP server |
| `src/transport/tls.ts` | `@elysia-microservice/transport-tls` | TLS server |
| `src/transport/nats.ts` | `@elysia-microservice/transport-nats` | NATS server |
| `src/transport/redis.ts` | `@elysia-microservice/transport-redis` | Redis server |
| `src/transport/kafka.ts` | `@elysia-microservice/transport-kafka` | Kafka server |
| `src/clients/tcp.ts` | `@elysia-microservice/client-tcp` | TCP client |
| `src/clients/tls.ts` | `@elysia-microservice/client-tls` | TLS client |
| `src/clients/nats.ts` | `@elysia-microservice/client-nats` | NATS client |
| `src/clients/redis.ts` | `@elysia-microservice/client-redis` | Redis client |
| `src/clients/kafka.ts` | `@elysia-microservice/client-kafka` | Kafka client |
| `src/clients/index.ts` | `@elysia-microservice/client-base` | Client factory |
| `src/clients/proxy.ts` | `@elysia-microservice/client-base` | Client proxy |
| `src/clients/resilience.ts` | `@elysia-microservice/client-base` | Resilience patterns |
| `src/adapters/nest.ts` | `@elysia-microservice/adapters` | NestJS adapter |

## Migration Examples

### Before (Single Package)

```typescript
// Old imports from single package
import { createRegistry } from "@elysia-microservice/legacy";
import { createTcpTransport } from "@elysia-microservice/legacy";
import { createTcpClient } from "@elysia-microservice/legacy";
```

### After (New Imports)

```typescript
import { createRegistry } from "@elysia-microservice/core";
import { createTcpTransport } from "@elysia-microservice/transport-tcp";
import { createTcpClient } from "@elysia-microservice/client-tcp";
```

## Installation Changes

### Before

```bash
bun add elysia-microservice
```

### After (Install Only What You Need)

```bash
# Core (always required)
bun add @elysia-microservice/core

# TCP Server
bun add @elysia-microservice/transport-tcp

# TCP Client
bun add @elysia-microservice/client-tcp

# Or use client factory
bun add @elysia-microservice/client-base

# Utilities (optional)
bun add @elysia-microservice/utils
```

## Code Migration Examples

### Example 1: Basic TCP Server

#### Before
```typescript
import { createRegistry, createTcpTransport } from "elysia-microservice";

const registry = createRegistry();
registry.registerMessage('get.user', async (data) => {
  return { id: data.id, name: 'John' };
});

const server = createTcpTransport(registry, { port: 4000 });
```

#### After
```typescript
import { createRegistry } from "@elysia-microservice/core";
import { createTcpTransport } from "@elysia-microservice/transport-tcp";

const registry = createRegistry();
registry.registerMessage('get.user', async (data) => {
  return { id: data.id, name: 'John' };
});

const server = createTcpTransport(registry, { port: 4000 });
```

### Example 2: Client with Discovery

#### Before
```typescript
import { createClient, StaticDiscovery, RoundRobinBalancer, createClientPool } from "elysia-microservice";

const discovery = new StaticDiscovery([{ host: '127.0.0.1', port: 4000 }]);
const balancer = new RoundRobinBalancer();
const pool = createClientPool(discovery, balancer, { transport: 'tcp' });
```

#### After
```typescript
import { StaticDiscovery, RoundRobinBalancer, createClientPool } from "@elysia-microservice/utils";
import { createClient } from "@elysia-microservice/client-base";

const discovery = new StaticDiscovery([{ host: '127.0.0.1', port: 4000 }]);
const balancer = new RoundRobinBalancer();
const pool = createClientPool(discovery, balancer, { transport: 'tcp' }, createClient);
```

### Example 3: Multiple Transports

#### Before
```typescript
import { createNatsTransport, createRedisClient, withResilience } from "elysia-microservice";
```

#### After
```typescript
import { createNatsTransport } from "@elysia-microservice/transport-nats";
import { createRedisClient } from "@elysia-microservice/client-redis";
import { withResilience } from "@elysia-microservice/client-base";
```

## Benefits of the New Structure

1. **Smaller Bundle Size**: Install only the transports you use
2. **Independent Versioning**: Each transport can be updated independently
3. **Better Tree-shaking**: Unused code is automatically removed
4. **Clearer Dependencies**: Know exactly what each package needs
5. **Easier Testing**: Test packages in isolation
6. **Future-proof**: Easy to add new transports without affecting existing ones

## Package Dependencies

```
@elysia-microservice/core (no dependencies)
  ↓
  ├── @elysia-microservice/utils
  ├── @elysia-microservice/transport-* (5 packages)
  ├── @elysia-microservice/client-* (5 packages)
  ├── @elysia-microservice/client-base
  └── @elysia-microservice/adapters
```

## Development Workflow

### Building Packages

```bash
# Build all packages
bun run build

# Build specific package
cd packages/core && bun run build
```

### Testing

Tests remain in the original structure but should be updated to import from the new packages.

## Questions?

See the main [README.md](./README.md) for detailed documentation or check individual package READMEs in `packages/*/README.md`.
