# Changelog

All notable changes to the Elysia Microservice Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Professional documentation structure with separate guides and API reference
- CODE_OF_CONDUCT.md based on Contributor Covenant 2.1
- Comprehensive CONTRIBUTING.md with development guidelines
- LICENSE file (MIT)
- Makefile for streamlined build, test, and publish operations
- Documentation organization in docs/ directory structure
- **DI System: Guards & Middleware**
  - Hierarchical authorization & middleware system with three scopes: global, group, and handler
  - `msGuard()` for authorization-only checks (can only throw)
  - `msMiddleware()` for cross-cutting concerns (can block + enrich context)
  - `msGroup(prefix)` for creating pattern-prefix-scoped guards/middleware
  - Metadata support throughout client send/emit and all transports (TCP, TLS, NATS, Redis, Kafka)
  - Proper execution order: Guards → Middleware.onBefore → Handler → Middleware.onAfter
  - Guard/middleware enrichment flows through entire handler context
- Comprehensive DI system tests covering guards, middleware, groups, and execution order

### Changed
- Reorganized documentation into logical directories (guides/, api/, contributing/)
- Updated README.md with professional formatting, badges, and clear navigation
- Moved architecture and migration guides to docs/ directory
- Updated advanced-features.md with extensive Guards & Middleware section and examples
- Updated core package README with DI system examples
- Enhanced main README with Guards & Middleware feature highlight

### Removed
- Temporary development markdown files from root directory

## [0.1.0] - 2026-01-19

### Added
- Initial monorepo structure with 14 modular packages
- Core package (@elysia-microservice/core) with registry, protocol, and pattern matching
- Utils package (@elysia-microservice/utils) with service discovery, load balancing, and chaos engineering
- Transport servers: TCP, TLS, NATS, Redis, and Kafka
- Transport clients: TCP, TLS, NATS, Redis, and Kafka
- Client base package with factory, proxy, and resilience patterns
- Framework adapters package (NestJS compatibility)
- Advanced pattern matching with wildcards, regex, and catchall handlers
- Lifecycle hooks (onBefore/onAfter) for cross-cutting concerns
- Global error handlers for requests and events
- MessageContext structure for all handlers
- Connection pooling with automatic failover
- Circuit breaker, retry, and timeout mechanisms
- Static and DNS-based service discovery
- Round-robin load balancing with failure tracking
- Chaos engineering tools for testing
- Elysia plugin for hybrid mode (HTTP + Microservice)
- Standalone microservice mode
- Health check endpoints in hybrid mode
- TypeScript project references for proper build dependencies
- Comprehensive test suite (unit and integration tests)
- Example applications demonstrating various features
- Package-level README files with usage examples

### Changed
- Migrated from single package to modular monorepo architecture
- Updated handler signature from `(data)` to `(ctx: MessageContext)`
- Changed registry API from direct map access to `resolveAndRunRequest/Event` methods
- Improved pattern matching with scoring algorithm
- Enhanced error handling with global handlers

### Technical Details
- Built with TypeScript 5.9.3
- Uses Bun workspaces for monorepo management
- Supports Bun >= 1.0.0 and Node.js >= 18
- Peer dependency on Elysia >= 0.5.0

## [0.0.1] - 2026-01-01

### Added
- Initial proof of concept
- Basic TCP transport
- Simple pattern matching
- NestJS TCP compatibility

---

## Release Guidelines

### Version Format
- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features (backward compatible)
- **Patch (0.0.X)**: Bug fixes (backward compatible)

### Release Process
1. Update version numbers in all package.json files
2. Update this CHANGELOG.md with all changes
3. Create git tag (e.g., `v0.2.0`)
4. Build all packages: `make build`
5. Run all tests: `make test`
6. Publish to npm: `make publish`

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat(scope):` - New features
- `fix(scope):` - Bug fixes
- `docs(scope):` - Documentation changes
- `chore(scope):` - Maintenance tasks
- `refactor(scope):` - Code refactoring
- `test(scope):` - Test changes
- `perf(scope):` - Performance improvements

### Breaking Changes
Always document breaking changes in the changelog under a "Breaking Changes" section:

```markdown
### Breaking Changes
- **Handler signature**: Changed from `(data)` to `(ctx: MessageContext)`
  - Migration: Update all handlers to use `ctx.data` instead of direct data parameter
  - Impact: All handler implementations must be updated
```

---

[Unreleased]: https://github.com/yourusername/elysia-microservice/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/elysia-microservice/releases/tag/v0.1.0
[0.0.1]: https://github.com/yourusername/elysia-microservice/releases/tag/v0.0.1
