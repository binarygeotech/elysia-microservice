# Elysia Microservice Monorepo

## Version History

### 0.1.0 - Initial Monorepo Split

- Restructured into modular monorepo with 14 separate packages
- Created packages for core, utils, transports, clients, and adapters
- Improved modularity - install only what you need
- Created 14 packages:
  - @elysia-microservice/core
  - @elysia-microservice/utils
  - @elysia-microservice/transport-tcp
  - @elysia-microservice/transport-tls
  - @elysia-microservice/transport-nats
  - @elysia-microservice/transport-redis
  - @elysia-microservice/transport-kafka
  - @elysia-microservice/client-tcp
  - @elysia-microservice/client-tls
  - @elysia-microservice/client-nats
  - @elysia-microservice/client-redis
  - @elysia-microservice/client-kafka
  - @elysia-microservice/client-base
  - @elysia-microservice/adapters
- Configured workspace using Bun workspaces
- Added TypeScript project references for proper build order
- Created comprehensive documentation for each package
