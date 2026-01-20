# Contributing to Elysia Microservice Framework

Thank you for your interest in contributing to the Elysia Microservice Framework! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include as many details as possible:

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Install packages '...'
2. Run code '...'
3. See error

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g., macOS 14.0]
- Bun version: [e.g., 1.0.0]
- Package version: [e.g., @elysia-microservice/core@0.1.0]
- Transport: [e.g., TCP, NATS, etc.]

**Additional context**
Add any other context about the problem here.
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue and provide:

- **Clear title and description** of the enhancement
- **Use cases** - why would this be useful?
- **Possible implementation** - if you have ideas on how to implement it
- **Alternatives considered** - what other solutions have you thought about?

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our [coding standards](#coding-standards)
3. **Add tests** for any new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass** (`bun test`)
6. **Submit a pull request** with a clear description of your changes

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18 (for some tooling)
- Git

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/elysia-microservice.git
cd elysia-microservice/base

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun test
```

### Building Packages

```bash
# Build all packages (respects dependency order)
make build

# Build specific packages
make build-core
make build-transports
make build-clients

# Clean build artifacts
make clean
```

### Working with Monorepo

This project uses Bun workspaces. Each package is in `packages/`:

```bash
# Work on a specific package
cd packages/core
bun run build
bun test

# Build all packages
cd /path/to/base
bun run build

# Clean build artifacts
bun run clean
```

### Testing Your Changes

```bash
# Unit tests (fast, no external dependencies)
make test-unit

# Integration tests (requires external services)
make test-integration

# Run all tests
make test

# Test a specific package
cd packages/core
bun test

# Test with coverage
make test-coverage
```

### Publishing Packages

**Note:** Only maintainers can publish packages.

```bash
# Dry run (test publish without actually publishing)
make publish-dry

# Publish all packages to npm
make publish

# Publish specific package
cd packages/core
npm publish --access public
```

## Project Structure

```
base/
├── packages/
│   ├── core/               # Core functionality, registry, patterns
│   ├── utils/              # Service discovery, load balancing, chaos
│   ├── transport-*/        # Transport server implementations
│   ├── client-*/           # Transport client implementations
│   ├── client-base/        # Client factory and resilience
│   └── adapters/           # Framework adapters (NestJS, etc.)
├── examples/               # Example applications
├── tests/                  # Integration tests
└── docs/                   # Documentation
```

### Package Dependencies

```
core (no internal deps)
  ↓
utils → core
  ↓
transports → core
  ↓
clients → core
  ↓
client-base → clients, core
  ↓
adapters → core, transports
```

## Coding Standards

### TypeScript Style

We use TypeScript with strict mode enabled. Follow these guidelines:

```typescript
// ✅ Good
export interface UserData {
  id: number;
  name: string;
  email?: string;
}

export async function getUser(id: number): Promise<UserData> {
  // Implementation
}

// ❌ Bad
export function getUser(id) {  // Missing type annotations
  // Implementation
}
```

### Code Formatting

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Max line length: 100 characters
- No trailing whitespace

### Naming Conventions

- **Files**: kebab-case (e.g., `round-robin.ts`)
- **Classes/Interfaces**: PascalCase (e.g., `PatternMatcher`)
- **Functions/Variables**: camelCase (e.g., `createRegistry`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PORT`)
- **Type aliases**: PascalCase (e.g., `MessageHandler`)

### Best Practices

1. **Single Responsibility**: Each function/class should do one thing well
2. **Explicit over Implicit**: Be clear about types and intentions
3. **Error Handling**: Always handle errors appropriately
4. **Async/Await**: Prefer async/await over promises
5. **Documentation**: Add JSDoc comments for public APIs

```typescript
/**
 * Creates a new registry for managing message and event handlers.
 * 
 * @returns A new registry instance with pattern matching capabilities
 * @example
 * ```ts
 * const registry = createRegistry();
 * registry.registerMessage('user.get', async (ctx) => {
 *   return { id: ctx.data.id, name: 'John' };
 * });
 * ```
 */
export function createRegistry(): Registry {
  // Implementation
}
```

## Testing Guidelines

### Unit Tests

- Located in `packages/*/tests/` or co-located with source files
- Test individual functions and classes in isolation
- Mock external dependencies
- Should be fast (< 1ms per test)

```typescript
import { describe, it, expect } from 'bun:test';
import { createRegistry } from '../src/registry';

describe('Registry', () => {
  it('should register and resolve message handlers', async () => {
    const registry = createRegistry();
    registry.registerMessage('test.pattern', async (ctx) => {
      return { result: ctx.data.value };
    });

    const result = await registry.resolveAndRunRequest('test.pattern', { value: 42 });
    expect(result).toEqual({ result: 42 });
  });
});
```

### Integration Tests

- Located in `tests/` at root
- Test interactions between packages
- May require external services (Docker Compose provided)
- Focus on real-world scenarios

### Test Coverage

- Aim for >80% coverage for core packages
- 100% coverage for critical paths (registry, protocol, patterns)
- Use meaningful tests, not just coverage numbers

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```bash
feat(core): add lifecycle hooks to pattern matcher

- Add onBefore and onAfter hooks to pattern registration
- Support global hooks via setRequestHooks/setEventHooks
- Update tests to cover hook execution

Closes #123

fix(transport-tcp): handle socket errors gracefully

Previously, socket errors would crash the server. Now they are
caught and logged appropriately.

Fixes #456

docs(readme): update quick start guide

- Add hybrid mode example
- Clarify plugin vs standalone usage
- Fix broken links

chore(deps): update elysia to 1.4.22
```

### Scope

The scope should be the package name without `@elysia-microservice/` prefix:
- `core`
- `utils`
- `transport-tcp`
- `client-nats`
- `adapters`
- etc.

Use `*` for changes affecting multiple packages.

## Documentation

### Code Documentation

- Add JSDoc comments to all exported functions, classes, and interfaces
- Include `@param`, `@returns`, `@throws`, `@example` tags
- Explain **why**, not just **what**

### README Updates

- Update package READMEs when adding features
- Keep examples simple and focused
- Add links to detailed guides in `docs/`

### Documentation Structure

```
docs/
├── guides/           # User guides and tutorials
├── api/              # API reference documentation
└── contributing/     # Contributor guides
```

When adding new features, update or create relevant documentation:

1. **API docs** for new public APIs
2. **Guide** for complex features
3. **Examples** in `examples/` directory
4. **CHANGELOG** entry

## Release Process

We use [Changesets](https://github.com/changesets/changesets) to manage versions and publish packages. This ensures only changed packages get version bumps, and internal `workspace:*` dependencies are bumped appropriately.

### Prerequisites

- You must be able to publish to npm for the organization
- Set `NPM_TOKEN` in your environment (for local publish) or in GitHub repo secrets (for CI)

```bash
export NPM_TOKEN=your-npm-token
```

### Standard Release (Changesets)

1. Create changesets (for each change)
  ```bash
  # Interactive: select packages and bump types
  make changeset

  # OR one-package helper
  make changeset-add-one PKG=@elysia-microservice/core BUMP=patch MSG="fix: tighten validation"
  ```

2. Review pending release plan
  ```bash
  make changeset-status
  ```

3. Apply versions and changelogs
  ```bash
  make release-version
  git add . && git commit -m "chore(release): version packages"
  ```

4. Publish changed packages
  ```bash
  # Option A: Local publish
  make release-publish

  # Option B: CI publish (recommended)
  # Push to main; Changesets GitHub Action will open a Release PR.
  # When that PR is merged, it will publish automatically using NPM_TOKEN.
  ```

### Single Package Release

Use this when you need to publish just one package (e.g., a transport) outside the coordinated release:

```bash
# Build just one
make build-one PKG=@elysia-microservice/transport-tcp

# Create a changeset for the package
make changeset-add-one PKG=@elysia-microservice/transport-tcp BUMP=patch MSG="fix: connection timeout handling"

# Apply versions and commit
make release-version
git add . && git commit -m "chore(release): version transport-tcp"

# Dry-run publish for that package
make publish-one-dry PKG=@elysia-microservice/transport-tcp

# Publish that package
make publish-one PKG=@elysia-microservice/transport-tcp
```

### Legacy Manual Release (Not Recommended)

If needed, you can still perform a manual release. Prefer Changesets for accuracy and safety.

1. Update versions manually
  ```bash
  make version VERSION=0.2.0
  ```

2. Update [CHANGELOG.md](CHANGELOG.md) manually, commit, tag and push

3. Build, test and publish
  ```bash
  make clean && make build && make test
  make publish-dry
  make publish
  ```

## Questions?

- Open an issue with the `question` label
- Start a discussion in GitHub Discussions
- Check existing documentation in `docs/`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Elysia Microservice Framework! 🎉
