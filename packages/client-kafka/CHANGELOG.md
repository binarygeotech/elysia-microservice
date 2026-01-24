# @elysia-microservice/client-kafka

## 0.2.0

### Minor Changes

- ## DI System: Guards & Middleware Implementation

  ### Core Package (`@elysia-microservice/core`)

  - **Added**: Hierarchical Dependency Injection system with three scope levels: global, group, and handler
  - **Added**: `GuardFunction` type for authorization-only checks (can only throw, no context enrichment)
  - **Added**: `Middleware` interface with `onBefore` (can enrich/block) and `onAfter` (side effects) phases
  - **Added**: `GroupBuilder` interface for creating pattern-prefix-scoped guards and middleware
  - **Added**: `msGuard()` plugin method to add global guards
  - **Added**: `msMiddleware()` plugin method to add global middleware (backward compatible with legacy Hooks)
  - **Added**: `msGroup(prefix)` plugin method to create scoped groups
  - **Enhanced**: `Entry` interface to support handler-level middleware
  - **Enhanced**: `PatternMatcher` class with guard/middleware execution pipeline
  - **Enhanced**: Error propagation in matcher to ensure errors reach transport layer
  - **Updated**: `types.ts` with new DI system types
  - **Updated**: `plugin.ts` with new DI system methods
  - **Updated**: `patterns/matcher.ts` with guard/middleware execution logic and proper error handling
  - **Updated**: `patterns/registry.ts` with DI system registry methods
  - **Updated**: `protocol/packet.ts` to include optional `meta` field for metadata transport
  - **Added**: Comprehensive test suite (`tests/di-system.test.ts`) with 9 tests covering:
    - Global guards for authentication
    - Group-scoped guards for role-based access control
    - Global middleware for context enrichment
    - Group middleware for domain-specific concerns
    - Multiple guards execution order
    - Middleware onBefore/onAfter phases

  ### Transport Packages (TCP, TLS, NATS, Redis, Kafka)

  - **Enhanced**: All transport servers to extract and pass `packet.meta` to registry instead of connection context
  - **Updated**: Request/event handlers to receive metadata through proper context parameter
  - **Result**: Metadata flows from client through all transports to handlers/guards/middleware

  ### Client Packages (TCP, TLS, NATS, Redis, Kafka)

  - **Enhanced**: `send()` and `emit()` methods to accept optional `options` parameter with `meta` field
  - **Updated**: TCP client error handling to properly check for `msg.error` and reject promise on error
  - **Updated**: TCP client to pass full message response including error field

  ### Documentation

  - **Updated**: `README.md` with Guards & Middleware feature highlight
  - **Updated**: `docs/guides/advanced-features.md` with comprehensive 200+ line DI system section including:
    - Guards vs Middleware semantics
    - Global guard/middleware examples
    - Group scope examples
    - Execution order pipeline documentation
    - Common patterns (auth, RBAC, metrics, rate limiting)
    - Metadata passing examples
  - **Updated**: `packages/core/README.md` with DI system methods and examples
  - **Updated**: `CHANGELOG.md` with detailed entry for DI system implementation

  ### Key Features

  ✅ **Authorization First**: Guards enforce access control before handler execution
  ✅ **Request Enrichment**: Middleware can add data to context for handler consumption
  ✅ **Hierarchical Scoping**: Global rules, domain groups, and handler-specific customization
  ✅ **Clean Separation**: Guards (block only) vs Middleware (block + enrich)
  ✅ **Execution Order**: Well-defined pipeline: Guards → onBefore → Handler → onAfter
  ✅ **Metadata Support**: End-to-end metadata flow from client to all decision points
  ✅ **Backward Compatible**: Existing Hooks still work via msMiddleware()
  ✅ **Fully Tested**: 9 new tests validating all scenarios

  ### Breaking Changes

  None - All changes are additive and backward compatible with existing handler registration and execution.

  ### Migration Notes

  - Existing code using `.onMsMessage()` and `.onMsEvent()` continues to work unchanged
  - Existing handler-level hooks via `registerMessage(..., hooks)` continue to work
  - Legacy `app.msMiddleware(hooks)` syntax still supported for setting global hooks
  - New DI system methods (guards, middleware, groups) are opt-in enhancements

### Patch Changes

- Updated dependencies
  - @elysia-microservice/core@0.3.0

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
