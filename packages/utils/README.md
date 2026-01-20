# @elysia-microservice/utils

Utilities for Elysia microservices framework including service discovery, load balancing, client pooling, and chaos engineering.

## Features

- **Service Discovery**: Static and DNS-based service discovery
- **Load Balancing**: Round-robin load balancer with failure tracking
- **Client Pool**: Connection pooling with automatic failover
- **Chaos Engineering**: Inject failures and latency for testing

## Installation

```bash
bun add @elysia-microservice/utils
```

## Usage

```typescript
import { StaticDiscovery, RoundRobinBalancer, createClientPool } from '@elysia-microservice/utils';

const discovery = new StaticDiscovery([
  { host: '127.0.0.1', port: 4000 },
  { host: '127.0.0.1', port: 4001 }
]);

const balancer = new RoundRobinBalancer();
```
