# OpenAPI Codegen Monorepo

Transform OpenAPI specifications into type-safe Zod schemas, TypeScript types, Playwright API clients, and k6 performance test scripts.

## Packages

### [@cerios/openapi-core](./packages/openapi-core)

Shared utilities and types used across all packages.

```bash
pnpm add @cerios/openapi-core
```

---

### [@cerios/openapi-to-typescript](./packages/openapi-to-typescript)

TypeScript type generator - Generate TypeScript interfaces and types from OpenAPI specifications.

```bash
pnpm add @cerios/openapi-to-typescript
```

**Features:**

- 📝 Clean TypeScript interface generation
- 🎯 Full OpenAPI 3.x support
- 🔀 Smart type composition (allOf, oneOf, anyOf)

[View full documentation →](./packages/openapi-to-typescript)

---

### [@cerios/openapi-to-zod](./packages/openapi-to-zod)

Core schema generator - Transform OpenAPI YAML specifications into Zod v4 compliant schemas with full TypeScript support.

```bash
pnpm add @cerios/openapi-to-zod
```

**Features:**

- ✅ Zod v4 compatible with latest features
- 📝 Automatic TypeScript type generation
- 🎯 Zod enums with proper handling
- 🔧 Multiple validation modes (strict/normal/loose)
- 📐 Full format support (uuid, email, url, date, etc.)
- 🔀 Smart schema composition (allOf, oneOf, anyOf)
- 📊 Batch processing with config files

[View full documentation →](./packages/openapi-to-zod)

---

### [@cerios/openapi-to-zod-playwright](./packages/openapi-to-zod-playwright)

Playwright client generator - Generate type-safe Playwright API clients with automatic request/response validation.

```bash
pnpm add @cerios/openapi-to-zod-playwright @playwright/test zod
```

**Features:**

- 🎭 Playwright `APIRequestContext` integration
- 🔒 Full type safety with Zod validation
- 🎯 Two-layer architecture (client + service)
- ✅ Automatic request/response validation
- 🧪 Testing-friendly with error methods
- 📝 Status code validation with Playwright `expect()`

[View full documentation →](./packages/openapi-to-zod-playwright)

---

### [@cerios/openapi-to-k6](./packages/openapi-to-k6)

k6 performance test generator - Generate k6 load testing scripts from OpenAPI specifications.

```bash
pnpm add @cerios/openapi-to-k6
```

**Features:**

- ⚡ k6 script generation
- 🔧 Configurable test scenarios
- 📊 Batch processing support

[View full documentation →](./packages/openapi-to-k6)

---

## Development

This monorepo uses [pnpm](https://pnpm.io/) for package management.

### Initial Setup

> **Important:** After a fresh clone, you must build the packages before the workspace links will work correctly.

```bash
# Install dependencies (you may see warnings about missing binaries - this is expected)
pnpm install

# Build all packages (required after fresh clone)
pnpm build

# Re-run install to properly link workspace binaries
pnpm install
```

### Common Commands

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm compile

# Lint
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Monorepo Structure

```
openapi-codegen/
├── packages/
│   ├── openapi-core/              # Shared utilities
│   ├── openapi-to-typescript/     # TypeScript type generator
│   ├── openapi-to-zod/            # Zod schema generator
│   ├── openapi-to-zod-playwright/ # Playwright client generator
│   └── openapi-to-k6/             # k6 test generator
├── fixtures/                       # Test fixtures
├── scripts/                        # Build scripts
├── .github/workflows/              # CI/CD workflows
├── .changeset/                     # Changesets for versioning
└── package.json                    # Root workspace config
```

## Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for version management.

### Create a changeset

```bash
pnpm changeset
```

Packages are independently versioned and can be released separately.

## Requirements

- Node.js >= 20
- pnpm >= 9

## License

MIT © Ronald Veth - Cerios

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please use the [GitHub issues](https://github.com/CeriosTesting/openapi-codegen/issues) page.
