# @elysia-microservice/client-kafka

## 0.1.6

### Patch Changes

- ## NestJS-Style Decorators & Adapter Refactor

  - **New**: Added parameter decorators `@Payload()`, `@Ctx()`, and `@App()` for handler parameter injection
  - **New**: Support for Observable-backed event handlers for reactive event processing
  - **New**: Benchmark suite comparing Elysia microservices vs NestJS (echo servers + load generator)
  - **Changed**: Refactored adapter architecture from functional `adaptNestMessages()` to declarative plugin-style with `adapters` config option
  - **Fixed**: Decorator binding issues in stage-3 TypeScript decorators (legacy + stage-3 support)
  - **Fixed**: Event handlers now properly execute with parameter injection via metadata system
  - **Docs**: Updated README and adapters documentation with new decorator examples and usage patterns

- Updated dependencies
  - @elysia-microservice/core@0.2.0

## 0.1.5

### Patch Changes

- chore(release): Fixed release publishing flow with bun publish
- Updated dependencies
  - @elysia-microservice/core@0.1.5

## 0.1.4

### Patch Changes

- fix: workspace protocol conversion
- Updated dependencies
  - @elysia-microservice/core@0.1.4

## 0.1.3

### Patch Changes

- a5f3890: Fixing dependencies version on release with changeset
- Updated dependencies [a5f3890]
  - @elysia-microservice/core@0.1.3

## 0.1.2

### Patch Changes

- chore: bump release version
- Updated dependencies
  - @elysia-microservice/core@0.1.2

## 0.1.1

### Patch Changes

- chore: dependencies version update
- Updated dependencies
  - @elysia-microservice/core@0.1.1
