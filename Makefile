.PHONY: help install clean build test lint format publish \
	changeset changeset-status release-version release-publish release-local

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Display this help message
	@echo "$(BLUE)Elysia Microservice Framework$(NC)"
	@echo "$(BLUE)=============================$(NC)"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@bun install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

clean: ## Clean all build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@find packages -name 'dist' -type d -exec rm -rf {} + 2>/dev/null || true
	@find packages -name 'tsconfig.tsbuildinfo' -type f -exec rm -rf {} + 2>/dev/null || true
	@echo "$(YELLOW)Note: Run 'make install' after clean to relink workspace packages$(NC)"
	@echo "$(GREEN)✓ Build artifacts cleaned$(NC)"

# Build targets
build: ## Build all packages (in correct order)
	@echo "$(BLUE)Building all packages...$(NC)"
	@bun run build
	@echo "$(GREEN)✓ All packages built successfully$(NC)"

build-core: ## Build core package
	@echo "$(BLUE)Building core package...$(NC)"
	@cd packages/core && bun run build
	@echo "$(GREEN)✓ Core package built$(NC)"

build-utils: ## Build utils package
	@echo "$(BLUE)Building utils package...$(NC)"
	@cd packages/utils && bun run build
	@echo "$(GREEN)✓ Utils package built$(NC)"

build-transports: ## Build all transport packages
	@echo "$(BLUE)Building transport packages...$(NC)"
	@cd packages/transport-tcp && bun run build
	@cd packages/transport-tls && bun run build
	@cd packages/transport-nats && bun run build
	@cd packages/transport-redis && bun run build
	@cd packages/transport-kafka && bun run build
	@echo "$(GREEN)✓ Transport packages built$(NC)"

build-clients: ## Build all client packages
	@echo "$(BLUE)Building client packages...$(NC)"
	@cd packages/client-tcp && bun run build
	@cd packages/client-tls && bun run build
	@cd packages/client-nats && bun run build
	@cd packages/client-redis && bun run build
	@cd packages/client-kafka && bun run build
	@cd packages/client-base && bun run build
	@echo "$(GREEN)✓ Client packages built$(NC)"

build-adapters: ## Build adapters package
	@echo "$(BLUE)Building adapters package...$(NC)"
	@cd packages/adapters && bun run build
	@echo "$(GREEN)✓ Adapters package built$(NC)"

rebuild: install build ## Clean, install, and rebuild all packages

# Test targets
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@bun test
	@echo "$(GREEN)✓ All tests passed$(NC)"

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	@bun run test:unit
	@echo "$(GREEN)✓ Unit tests passed$(NC)"

test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(NC)"
	@bun run test:integration
	@echo "$(GREEN)✓ Integration tests passed$(NC)"

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@bun test --coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"

test-watch: ## Run tests in watch mode
	@echo "$(BLUE)Running tests in watch mode...$(NC)"
	@bun test --watch

# Lint and format targets
lint: ## Lint all packages
	@echo "$(BLUE)Linting packages...$(NC)"
	@for dir in packages/*; do \
		if [ -f "$$dir/package.json" ]; then \
			echo "Linting $$dir..."; \
			cd $$dir && npm run lint 2>/dev/null || echo "No lint script in $$dir"; \
			cd ../..; \
		fi \
	done
	@echo "$(GREEN)✓ Linting complete$(NC)"

format: ## Format code with prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	@bunx prettier --write "packages/*/src/**/*.ts" "packages/*/tests/**/*.ts"
	@echo "$(GREEN)✓ Code formatted$(NC)"

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	@bunx prettier --check "packages/*/src/**/*.ts" "packages/*/tests/**/*.ts"

# Development targets
dev: ## Start development mode (rebuild on changes)
	@echo "$(BLUE)Starting development mode...$(NC)"
	@bun run build --watch

dev-core: ## Start core package in development mode
	@echo "$(BLUE)Starting core development...$(NC)"
	@cd packages/core && bun run dev

# Example targets
example-hybrid: ## Run hybrid example (HTTP + Microservice)
	@echo "$(BLUE)Running hybrid example...$(NC)"
	@cd examples && bun run hybrid

example-standalone: ## Run standalone microservice example
	@echo "$(BLUE)Running standalone example...$(NC)"
	@cd examples && bun run standalone

example-patterns: ## Run pattern matching example
	@echo "$(BLUE)Running pattern matching example...$(NC)"
	@cd examples && bun run src/pattern-matching-server.ts

# Validation targets
validate: clean install build test ## Full validation (clean, install, build, test)
	@echo "$(GREEN)✓ Full validation passed$(NC)"

check: build test lint format-check ## Quick validation (build, test, lint, format check)
	@echo "$(GREEN)✓ Quick check passed$(NC)"

# Version management
version: ## Update version in all packages (usage: make version VERSION=0.2.0)
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION is required. Usage: make version VERSION=0.2.0$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Updating version to $(VERSION)...$(NC)"
	@jq '.version = "$(VERSION)"' package.json > package.json.tmp && mv package.json.tmp package.json
	@for dir in packages/*; do \
		if [ -f "$$dir/package.json" ]; then \
			jq '.version = "$(VERSION)"' $$dir/package.json > $$dir/package.json.tmp && mv $$dir/package.json.tmp $$dir/package.json; \
		fi \
	done
	@echo "$(GREEN)✓ Version updated to $(VERSION)$(NC)"

# Publishing targets
publish-check: ## Check if packages are ready for publishing
	@echo "$(BLUE)Checking packages for publishing...$(NC)"
	@for dir in packages/*; do \
		if [ -f "$$dir/package.json" ]; then \
			echo "Checking $$dir..."; \
			cd $$dir && npm pack --dry-run; \
			cd ../..; \
		fi \
	done
	@echo "$(GREEN)✓ Publish check complete$(NC)"

publish-dry: build test ## Dry run publish (test without actually publishing)
	@echo "$(YELLOW)Performing dry run publish...$(NC)"
	@for dir in packages/*; do \
		if [ -f "$$dir/package.json" ]; then \
			echo "Dry run: $$dir..."; \
			cd $$dir && npm publish --dry-run --access public; \
			cd ../..; \
		fi \
	done
	@echo "$(GREEN)✓ Dry run complete$(NC)"

publish: build test ## Publish all packages to npm
	@echo "$(YELLOW)⚠️  Publishing to npm...$(NC)"
	@read -p "Are you sure you want to publish? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		for dir in packages/*; do \
			if [ -f "$$dir/package.json" ]; then \
				echo "Publishing $$dir..."; \
				cd $$dir && npm publish --access public; \
				cd ../..; \
			fi \
		done; \
		echo "$(GREEN)✓ All packages published$(NC)"; \
	else \
		echo "$(YELLOW)Publish cancelled$(NC)"; \
	fi

publish-core: ## Publish only core package
	@echo "$(BLUE)Publishing core package...$(NC)"
	@cd packages/core && npm publish --access public
	@echo "$(GREEN)✓ Core package published$(NC)"

publish-utils: ## Publish only utils package
	@echo "$(BLUE)Publishing utils package...$(NC)"
	@cd packages/utils && npm publish --access public
	@echo "$(GREEN)✓ Utils package published$(NC)"

publish-adapters: ## Publish only adapters package
	@echo "$(BLUE)Publishing adapters package...$(NC)"
	@cd packages/adapters && npm publish --access public
	@echo "$(GREEN)✓ Adapters package published$(NC)"

publish-transports: ## Publish all transport packages
	@echo "$(BLUE)Publishing transport packages...$(NC)"
	@for dir in packages/transport-*; do \
		cd $$dir && npm publish --access public; \
		cd ../..; \
	done
	@echo "$(GREEN)✓ Transport packages published$(NC)"

publish-transport-tcp: ## Publish TCP transport package
	@echo "$(BLUE)Publishing TCP transport...$(NC)"
	@cd packages/transport-tcp && npm publish --access public
	@echo "$(GREEN)✓ TCP transport published$(NC)"

publish-transport-tls: ## Publish TLS transport package
	@echo "$(BLUE)Publishing TLS transport...$(NC)"
	@cd packages/transport-tls && npm publish --access public
	@echo "$(GREEN)✓ TLS transport published$(NC)"

publish-transport-nats: ## Publish NATS transport package
	@echo "$(BLUE)Publishing NATS transport...$(NC)"
	@cd packages/transport-nats && npm publish --access public
	@echo "$(GREEN)✓ NATS transport published$(NC)"

publish-transport-redis: ## Publish Redis transport package
	@echo "$(BLUE)Publishing Redis transport...$(NC)"
	@cd packages/transport-redis && npm publish --access public
	@echo "$(GREEN)✓ Redis transport published$(NC)"

publish-transport-kafka: ## Publish Kafka transport package
	@echo "$(BLUE)Publishing Kafka transport...$(NC)"
	@cd packages/transport-kafka && npm publish --access public
	@echo "$(GREEN)✓ Kafka transport published$(NC)"

publish-clients: ## Publish all client packages
	@echo "$(BLUE)Publishing client packages...$(NC)"
	@for dir in packages/client-*; do \
		cd $$dir && npm publish --access public; \
		cd ../..; \
	done
	@echo "$(GREEN)✓ Client packages published$(NC)"

publish-client-base: ## Publish client-base package
	@echo "$(BLUE)Publishing client-base...$(NC)"
	@cd packages/client-base && npm publish --access public
	@echo "$(GREEN)✓ Client-base published$(NC)"

publish-client-tcp: ## Publish TCP client package
	@echo "$(BLUE)Publishing TCP client...$(NC)"
	@cd packages/client-tcp && npm publish --access public
	@echo "$(GREEN)✓ TCP client published$(NC)"

publish-client-tls: ## Publish TLS client package
	@echo "$(BLUE)Publishing TLS client...$(NC)"
	@cd packages/client-tls && npm publish --access public
	@echo "$(GREEN)✓ TLS client published$(NC)"

publish-client-nats: ## Publish NATS client package
	@echo "$(BLUE)Publishing NATS client...$(NC)"
	@cd packages/client-nats && npm publish --access public
	@echo "$(GREEN)✓ NATS client published$(NC)"

publish-client-redis: ## Publish Redis client package
	@echo "$(BLUE)Publishing Redis client...$(NC)"
	@cd packages/client-redis && npm publish --access public
	@echo "$(GREEN)✓ Redis client published$(NC)"

publish-client-kafka: ## Publish Kafka client package
	@echo "$(BLUE)Publishing Kafka client...$(NC)"
	@cd packages/client-kafka && npm publish --access public
	@echo "$(GREEN)✓ Kafka client published$(NC)"

# Unpublish targets
unpublish-one: ## Unpublish a single package version (usage: make unpublish-one PKG=@elysia-microservice/transport-tcp VERSION=0.1.0)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make unpublish-one PKG=@elysia-microservice/transport-tcp VERSION=0.1.0$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION is required. Example: make unpublish-one PKG=@elysia-microservice/transport-tcp VERSION=0.1.0$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)⚠️  Unpublishing $(PKG)@$(VERSION)...$(NC)"
	@read -p "Are you sure you want to unpublish $(PKG)@$(VERSION)? This cannot be undone! (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		npm unpublish $(PKG)@$(VERSION) --force; \
		echo "$(GREEN)✓ $(PKG)@$(VERSION) unpublished$(NC)"; \
	else \
		echo "$(YELLOW)Unpublish cancelled$(NC)"; \
	fi

unpublish-package: ## Unpublish entire package (all versions) (usage: make unpublish-package PKG=@elysia-microservice/transport-tcp)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make unpublish-package PKG=@elysia-microservice/transport-tcp$(NC)"; \
		exit 1; \
	fi
	@echo "$(RED)⚠️  WARNING: This will unpublish ALL versions of $(PKG)!$(NC)"
	@read -p "Type the package name to confirm: " typed_pkg; \
	if [ "$$typed_pkg" = "$(PKG)" ]; then \
		npm unpublish $(PKG) --force; \
		echo "$(GREEN)✓ All versions of $(PKG) unpublished$(NC)"; \
	else \
		echo "$(YELLOW)Package name did not match. Unpublish cancelled$(NC)"; \
	fi

unpublish-all: ## Unpublish all packages at current version (usage: make unpublish-all VERSION=0.1.0)
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION is required. Example: make unpublish-all VERSION=0.1.0$(NC)"; \
		exit 1; \
	fi
	echo "$(YELLOW)⚠️  Unpublishing all packages at version $(VERSION)...$(NC)"; \
	read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		for dir in packages/*; do \
			if [ -f "$$dir/package.json" ]; then \
				name=$$(jq -r .name $$dir/package.json); \
				echo "Unpublishing $$name@$(VERSION)..."; \
				npm unpublish "$$name@$(VERSION)" --force; \
				echo "$(GREEN)✓ $$name@$(VERSION) unpublished$(NC)"; \
			fi; \
		done; \
		echo "$(GREEN)✓ Unpublishing complete$(NC)"; \
	else \
		echo "$(YELLOW)Unpublishing cancelled$(NC)"; \
	fi

deprecate-one: ## Deprecate a package version (usage: make deprecate-one PKG=@elysia-microservice/transport-tcp VERSION=0.1.0 MSG="Use 0.2.0 instead")
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make deprecate-one PKG=@elysia-microservice/transport-tcp VERSION=0.1.0 MSG=\"...\"$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION is required.$(NC)"; \
		exit 1; \
	fi
	@msg="$(MSG)"; \
	if [ -z "$$msg" ]; then \
		msg="This version is deprecated"; \
	fi; \
	echo "$(YELLOW)Deprecating $(PKG)@$(VERSION)...$(NC)"; \
	npm deprecate $(PKG)@$(VERSION) "$$msg"; \
	echo "$(GREEN)✓ $(PKG)@$(VERSION) deprecated$(NC)"

deprecate-all: ## Deprecate all packages at current version (usage: make deprecate-all VERSION=0.1.0 MSG="Use 0.2.0")
	@if [ -z "$(VERSION)" ]; then \
		echo "$(RED)Error: VERSION is required. Example: make deprecate-all VERSION=0.1.0 MSG=\"Use 0.2.0\"$(NC)"; \
		exit 1; \
	fi
	@msg="$(MSG)"; \
	if [ -z "$$msg" ]; then \
		msg="This version is deprecated"; \
	fi; \
	echo "$(YELLOW)⚠️  Deprecating all packages at version $(VERSION)...$(NC)"; \
	read -p "Are you sure? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		for dir in packages/*; do \
			if [ -f "$$dir/package.json" ]; then \
				name=$$(jq -r .name $$dir/package.json); \
				echo "Deprecating $$name@$(VERSION)..."; \
				npm deprecate $$name@$(VERSION) "$$msg" || echo "  $(YELLOW)Warning: Could not deprecate $$name@$(VERSION)$(NC)"; \
			fi; \
		done; \
		echo "$(GREEN)✓ Deprecation complete$(NC)"; \
	else \
		echo "$(YELLOW)Deprecation cancelled$(NC)"; \
	fi

# Documentation targets
docs-serve: ## Serve documentation locally
	@echo "$(BLUE)Serving documentation...$(NC)"
	@if command -v mdbook > /dev/null; then \
		mdbook serve docs; \
	else \
		echo "$(YELLOW)mdbook not installed. Install with: cargo install mdbook$(NC)"; \
	fi

docs-build: ## Build documentation
	@echo "$(BLUE)Building documentation...$(NC)"
	@echo "$(GREEN)✓ Documentation in docs/ directory$(NC)"

# Docker targets
docker-build: ## Build Docker images for examples
	@echo "$(BLUE)Building Docker images...$(NC)"
	@docker-compose build
	@echo "$(GREEN)✓ Docker images built$(NC)"

docker-up: ## Start Docker services (Redis, NATS, Kafka)
	@echo "$(BLUE)Starting Docker services...$(NC)"
	@docker-compose up -d
	@echo "$(GREEN)✓ Docker services started$(NC)"

docker-down: ## Stop Docker services
	@echo "$(BLUE)Stopping Docker services...$(NC)"
	@docker-compose down
	@echo "$(GREEN)✓ Docker services stopped$(NC)"

# Release (Changesets) targets
changeset: ## Create a new changeset (interactive)
	@echo "$(BLUE)Starting Changesets...$(NC)"
	@npx changeset

changeset-status: ## Show pending releases (concise)
	@echo "$(BLUE)Changesets status (pending releases) ...$(NC)"
	@npx changeset status || true

changeset-status-verbose: ## Show full status incl. unchanged packages
	@echo "$(BLUE)Changesets status (verbose, includes unchanged) ...$(NC)"
	@npx changeset status --verbose || true

changeset-status-json: ## Show status as JSON for tooling
	@npx changeset status --output=json || true

changeset-plan: ## Show only packages that will be released (name -> newVersion (type))
	@echo "$(BLUE)Changesets release plan (changed packages only)...$(NC)"
	@npx changeset status --output=json | jq -r 'if ([.releases[] | select(.type != "none")] | length) == 0 then "No packages will be released" else [.releases[] | select(.type != "none")][] | "\(.name) @ \(.oldVersion) -> \(.newVersion) (\(.type))" end'

changeset-plan-one: ## Show release info for one package (usage: make changeset-plan-one PKG=@elysia-microservice/core)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make changeset-plan-one PKG=@elysia-microservice/core$(NC)"; \
		exit 1; \
	fi
	@npx changeset status --output=json | jq -r --arg PKG "$(PKG)" '[.releases[] | select(.name == $PKG)] | if length == 0 then "No release planned for " + $PKG else .[] | "\(.name) @ \(.oldVersion) -> \(.newVersion) (\(.type))" end'

release-version: ## Apply version bumps and update changelogs (changesets)
	@echo "$(BLUE)Applying version changes with Changesets...$(NC)"
	@npx changeset version
	@echo "$(BLUE)Updating lockfile...$(NC)"
	@bun install
	@echo "$(YELLOW)Note: workspace:* will be converted to versions during publish$(NC)"
	@echo "$(YELLOW)Reminder: commit the version changes before publishing$(NC)"

# AUTH_MODE?=cli
# release-publish: build test ## Publish all changed packages to npm (requires NPM_TOKEN)
# 	@if [ -z "$$NPM_TOKEN" and "$AUTH_MODE" === "token"]; then \
# 		echo "$(RED)Error: NPM_TOKEN is not set in environment.$(NC)"; \
# 		echo "$(YELLOW)Set it once in your shell: export NPM_TOKEN=...$(NC)"; \
# 		exit 1; \
# 	fi
# 	@echo "$(BLUE)Publishing via Changesets...$(NC)"
# 	@npx changeset publish
# 	@echo "$(GREEN)✓ Publish complete$(NC)"


# Helper function to get packages that need publishing
get-packages-to-publish:
	@npx changeset status --output=json | jq -r '[.releases[] | select(.type != "none")] | .[] | .name'

# Default registry (can be overridden)
REGISTRY?=default
release-publish: build test ## Publish changed packages via Changesets (convert workspace:* to local versions)
	@registry="$(REGISTRY)"; \
	registry=$$(printf "%s" "$$registry" | tr "[:upper:]" "[:lower:]"); \
	\
	echo "$(BLUE)Converting workspace:* to local versions before publish...$(NC)"; \
	for dir in packages/*; do \
		if [ -f "$$dir/package.json" ]; then \
			pkgName=$$(jq -r '.name' $$dir/package.json); \
			pkgVersion=$$(jq -r '.version' $$dir/package.json); \
			for otherDir in packages/*; do \
				if [ -f "$$otherDir/package.json" ]; then \
					jq --arg name "$$pkgName" --arg ver "$$pkgVersion" \
					   'if .dependencies[$$name] == "workspace:*" then .dependencies[$$name] = $$ver else . end | \
					    if .devDependencies[$$name] == "workspace:*" then .devDependencies[$$name] = $$ver else . end | \
					    if .peerDependencies[$$name] == "workspace:*" then .peerDependencies[$$name] = $$ver else . end' \
					   $$otherDir/package.json > $$otherDir/package.json.tmp && \
					mv $$otherDir/package.json.tmp $$otherDir/package.json; \
				fi; \
			done; \
		fi; \
	done; \
	\
	echo "$(BLUE)Publishing packages via Changesets...$(NC)"; \
	if [ "$$registry" = "default" ] || [ -z "$$registry" ]; then \
		bunx changeset publish; \
	else \
		NPM_CONFIG_REGISTRY="$$registry" bunx changeset publish; \
	fi; \
	publish_status=$$?; \
	\
	echo "$(BLUE)Reverting workspace:* after publish...$(NC)"; \
	git checkout -- packages/*/package.json; \
	\
	if [ $$publish_status -eq 0 ]; then \
		echo "$(GREEN)✓ Publish complete$(NC)"; \
		exit 0; \
	else \
		echo "$(RED)✗ Publish failed$(NC)"; \
		exit 1; \
	fi

release-local: ## Version + publish locally (version, install, build, publish)
	@$(MAKE) release-version
	@$(MAKE) build
	@$(MAKE) test
	@$(MAKE) release-publish

# Single-package release helpers
.PHONY: build-one publish-one publish-one-dry changeset-add-one

build-one: ## Build a single package (usage: make build-one PKG=@elysia-microservice/transport-tcp)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make build-one PKG=@elysia-microservice/transport-tcp$(NC)"; \
		exit 1; \
	fi
	@dir=$$(for d in packages/*; do \
		if [ -f "$$d/package.json" ]; then \
			name=$$(jq -r .name $$d/package.json); \
			if [ "$$name" = "$(PKG)" ]; then echo $$d; fi; \
		fi; \
	done); \
	if [ -z "$$dir" ]; then \
		echo "$(RED)Package $(PKG) not found under packages/*$(NC)"; \
		exit 1; \
	fi; \
	echo "$(BLUE)Building $$dir...$(NC)"; \
	cd $$dir && bun run build && echo "$(GREEN)✓ Built $(PKG)$(NC)"

publish-one-dry: ## Dry run publish for a single package (usage: make publish-one-dry PKG=@elysia-microservice/transport-tcp)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make publish-one-dry PKG=@elysia-microservice/transport-tcp$(NC)"; \
		exit 1; \
	fi
	@dir=$$(for d in packages/*; do \
		if [ -f "$$d/package.json" ]; then \
			name=$$(jq -r .name $$d/package.json); \
			if [ "$$name" = "$(PKG)" ]; then echo $$d; fi; \
		fi; \
	done); \
	if [ -z "$$dir" ]; then \
		echo "$(RED)Package $(PKG) not found under packages/*$(NC)"; \
		exit 1; \
	fi; \
	echo "$(YELLOW)Dry publishing $$dir...$(NC)"; \
	cd $$dir && npm publish --dry-run --access public && echo "$(GREEN)✓ Dry publish ok $(NC)"

publish-one: ## Publish a single package to npm (usage: make publish-one PKG=@elysia-microservice/transport-tcp)
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make publish-one PKG=@elysia-microservice/transport-tcp$(NC)"; \
		exit 1; \
	fi
	@if [ -z "$$NPM_TOKEN" ]; then \
		echo "$(YELLOW)Note: NPM_TOKEN not set; make sure you're logged in with npm CLI$(NC)"; \
	fi
	@dir=$$(for d in packages/*; do \
		if [ -f "$$d/package.json" ]; then \
			name=$$(jq -r .name $$d/package.json); \
			if [ "$$name" = "$(PKG)" ]; then echo $$d; fi; \
		fi; \
	done); \
	if [ -z "$$dir" ]; then \
		echo "$(RED)Package $(PKG) not found under packages/*$(NC)"; \
		exit 1; \
	fi; \
	echo "$(BLUE)Publishing $$dir...$(NC)"; \
	cd $$dir && npm publish --access public && echo "$(GREEN)✓ Published $(PKG)$(NC)"

BUMP?=patch
MSG?=Release $(PKG)
changeset-add-one: ## Create a changeset for one package (usage: make changeset-add-one PKG=@elysia-microservice/transport-tcp BUMP=patch MSG="fix: ...")
	@if [ -z "$(PKG)" ]; then \
		echo "$(RED)Error: PKG is required. Example: make changeset-add-one PKG=@elysia-microservice/core BUMP=patch MSG=\"fix: ...\"$(NC)"; \
		exit 1; \
	fi
	@if [ "$(BUMP)" != "patch" ] && [ "$(BUMP)" != "minor" ] && [ "$(BUMP)" != "major" ]; then \
		echo "$(RED)Error: BUMP must be patch|minor|major$(NC)"; \
		exit 1; \
	fi
	@mkdir -p .changeset; \
	id=$$(date +%Y%m%d%H%M%S)-$$(echo "$(PKG)" | tr -cd '[:alnum:]' | tr '[:upper:]' '[:lower:]'); \
	file=.changeset/$$id.md; \
	echo "---" > $$file; \
	echo '"$(PKG)": $(BUMP)' >> $$file; \
	echo "---" >> $$file; \
	echo "" >> $$file; \
	echo "$(MSG)" >> $$file; \
	echo "$(GREEN)✓ Created $$file for $(PKG) ($(BUMP))$(NC)"

changeset-add-all: ## Create changesets for ALL packages (usage: make changeset-add-all BUMP=patch MSG="fix: ...")
	@if [ "$(BUMP)" != "patch" ] && [ "$(BUMP)" != "minor" ] && [ "$(BUMP)" != "major" ]; then \
		echo "$(RED)Error: BUMP must be patch|minor|major$(NC)"; \
		exit 1; \
	fi
	@msg="$(MSG)"; \
	if [ -z "$$msg" ]; then \
		msg="Release all packages"; \
	fi; \
	echo "$(BLUE)Creating changesets for ALL packages (BUMP=$(BUMP))...$(NC)"; \
	mkdir -p .changeset; \
	id=$$(date +%Y%m%d%H%M%S); \
	count=0; \
	for dir in packages/*; do \
		if [ -f "$$dir/package.json" ]; then \
			name=$$(jq -r '.name' $$dir/package.json); \
			file=.changeset/$$(printf "%s-%03d" "$$id" $$count).md; \
			echo "---" > $$file; \
			echo "\"$$name\": $(BUMP)" >> $$file; \
			echo "---" >> $$file; \
			echo "" >> $$file; \
			echo "$$msg" >> $$file; \
			echo "  $(GREEN)✓$$file$$NC)"; \
			count=$$((count + 1)); \
		fi; \
	done; \
	echo "$(GREEN)✓ Created $$count changesets for all packages$(NC)"

docker-logs: ## Show Docker service logs
	@docker-compose logs -f

# CI/CD helpers
ci: install build test lint format-check ## Run CI pipeline locally
	@echo "$(GREEN)✓ CI pipeline passed$(NC)"

pre-commit: format lint test ## Run pre-commit checks
	@echo "$(GREEN)✓ Pre-commit checks passed$(NC)"

pre-push: build test ## Run pre-push checks
	@echo "$(GREEN)✓ Pre-push checks passed$(NC)"

# Stats and info
stats: ## Show project statistics
	@echo "$(BLUE)Project Statistics$(NC)"
	@echo "$(BLUE)==================$(NC)"
	@echo "Packages: $$(ls -d packages/* | wc -l | tr -d ' ')"
	@echo "TypeScript files: $$(find packages -name '*.ts' | wc -l | tr -d ' ')"
	@echo "Test files: $$(find packages -name '*.test.ts' | wc -l | tr -d ' ')"
	@echo "Lines of code: $$(find packages -name '*.ts' -exec cat {} \; | wc -l | tr -d ' ')"

list-packages: ## List all packages
	@echo "$(BLUE)Packages:$(NC)"
	@for dir in packages/*; do \
		if [ -f "$$dir/package.json" ]; then \
			name=$$(jq -r '.name' $$dir/package.json); \
			version=$$(jq -r '.version' $$dir/package.json); \
			echo "  $(GREEN)$$name$(NC) @ $(YELLOW)$$version$(NC)"; \
		fi \
	done

# Dependency management
deps-update: ## Update all dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@bun update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

deps-check: ## Check for outdated dependencies
	@echo "$(BLUE)Checking for outdated dependencies...$(NC)"
	@bun outdated

deps-audit: ## Run security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	@npm audit

# Quick commands
quick-test: ## Quick test (unit tests only, no build)
	@bun run test:unit

quick-build: ## Quick build (no clean)
	@bun run build

.PHONY: help install clean build test lint format publish validate check \
        build-core build-utils build-transports build-clients build-adapters \
        test-unit test-integration test-coverage test-watch \
        format-check dev dev-core \
        example-hybrid example-standalone example-patterns \
        version publish-check publish-dry publish-core publish-transports publish-clients \
        docs-serve docs-build docker-build docker-up docker-down docker-logs \
        ci pre-commit pre-push stats list-packages \
        deps-update deps-check deps-audit quick-test quick-build rebuild
