# Package Dependency Graph

```
┌──────────────────────────────────────────────────────────────┐
│                      @elysia-microservice                     │
│                         Monorepo Root                         │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│   Transports │      │   Clients    │     │     Core     │
│   (5 pkgs)   │      │   (5 pkgs)   │     │   Registry   │
│              │      │              │     │   Protocol   │
│  - tcp       │      │  - tcp       │     │   Patterns   │
│  - tls       │      │  - tls       │     │   Plugin     │
│  - nats      │      │  - nats      │     │   Shutdown   │
│  - redis     │      │  - redis     │     └──────────────┘
│  - kafka     │      │  - kafka     │             │
└──────────────┘      └──────────────┘             │
        │                     │                     │
        │                     │              ┌──────┘
        │                     │              │
        │                     ▼              ▼
        │             ┌──────────────┬──────────────┐
        │             │ Client-Base  │    Utils     │
        │             │              │              │
        │             │  - Factory   │  - Discovery │
        │             │  - Proxy     │  - Balancer  │
        │             │  - Resilience│  - Pool      │
        │             │              │  - Chaos     │
        │             └──────────────┴──────────────┘
        │                     │              │
        │                     │              │
        └─────────────────────┼──────────────┘
                              │
                              ▼
                      ┌──────────────┐
                      │   Adapters   │
                      │              │
                      │  - NestJS    │
                      └──────────────┘
```

## Dependency Flow

### Build Order (Bottom-Up)
1. **Transports** (tcp, tls, nats, redis, kafka) - No internal dependencies
2. **Clients** (tcp, tls, nats, redis, kafka) - No internal dependencies
3. **Client-Base** - Uses client packages (peer dependencies)
4. **Utils** - Depends on core
5. **Core** - Dynamically imports transports, clients, and utils
6. **Adapters** - Depends on core

### Runtime Dependencies

#### Core Package
```
@elysia-microservice/core
├─┬ (dynamic) Transport packages
│ ├── @elysia-microservice/transport-tcp
│ ├── @elysia-microservice/transport-tls
│ ├── @elysia-microservice/transport-nats
│ ├── @elysia-microservice/transport-redis
│ └── @elysia-microservice/transport-kafka
├─┬ (dynamic) Client ecosystem
│ ├── @elysia-microservice/client-base
│ └── @elysia-microservice/utils
└── elysia (peer dependency)
```

#### Client-Base Package
```
@elysia-microservice/client-base
├── @elysia-microservice/core (workspace:*)
└─┬ (peer/optional) Client packages
  ├── @elysia-microservice/client-tcp
  ├── @elysia-microservice/client-tls
  ├── @elysia-microservice/client-nats
  ├── @elysia-microservice/client-redis
  └── @elysia-microservice/client-kafka
```

#### Utils Package
```
@elysia-microservice/utils
└── @elysia-microservice/core (workspace:*)
```

#### Adapters Package
```
@elysia-microservice/adapters
└── @elysia-microservice/core (workspace:*)
```

#### Transport Packages
```
@elysia-microservice/transport-<type>
└── @elysia-microservice/core (workspace:*)
```

#### Client Packages
```
@elysia-microservice/client-<type>
└── @elysia-microservice/core (workspace:*)
```

## External Dependencies

### Core
- `@types/node` - Node.js type definitions
- `typescript` - TypeScript compiler

### Transport-NATS
- `nats@^2.12.0` - NATS client library

### Transport-Redis  
- `redis@^4.6.0` - Redis client library

### Transport-Kafka
- `kafkajs@^2.2.4` - Apache Kafka client

### Client-NATS
- `nats@^2.12.0` - NATS client library

### Client-Redis
- `redis@^4.6.0` - Redis client library

### Client-Kafka
- `kafkajs@^2.2.4` - Apache Kafka client

## Peer Dependencies

All packages declare:
- `elysia@*` as optional peer dependency (only core actively uses it)

## Key Design Principles

### 1. Loose Coupling
- Packages can be used independently
- Core uses dynamic imports to avoid hard dependencies
- Transports and clients are completely decoupled

### 2. Tree-Shakeable
- Dynamic imports ensure unused transports aren't bundled
- Users only pay for what they use

### 3. Type Safety
- All packages export TypeScript definitions
- Workspace references ensure types flow correctly
- Module augmentation provides IDE autocomplete

### 4. Extensibility
- New transports can be added without modifying core
- Load balancers and discovery providers are pluggable
- Resilience patterns can be composed

### 5. Monorepo Benefits
- Shared TypeScript configuration
- Consistent versioning
- Easy cross-package changes
- Single source of truth
