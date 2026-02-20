---
"@cerios/openapi-core": minor
"@cerios/openapi-to-zod": patch
"@cerios/openapi-to-zod-playwright": patch
"@cerios/openapi-to-typescript": patch
---

Consolidate batch executor, CLI utilities, and config loader across packages

### @cerios/openapi-core (minor)

New exports for shared CLI and batch processing infrastructure:

- **CLI Utilities** (`cli-utils.ts`):
  - `findSpecFiles(patterns)` - Find OpenAPI spec files matching glob patterns
  - `ceriosMessages` - Array of fun loading messages
  - `getRandomCeriosMessage()` - Get a random loading message

- **Config Loader Factory** (`config-loader-factory.ts`):
  - `createConfigLoader<TConfig>(options, schema)` - Generic factory for creating type-safe config loaders using cosmiconfig
  - `mergeCliWithConfig<T>(specConfig, cliOptions)` - Merge CLI options with loaded config

- **Error Classes**:
  - `CliOptionsError` - For CLI argument validation errors
  - `SchemaGenerationError` - For schema generation failures
  - `CircularReferenceError` - For circular reference detection

### @cerios/openapi-to-zod (patch)

- Removed duplicate `batch-executor.ts` - now imports `executeBatch` from `@cerios/openapi-core`
- CLI utilities (`findSpecFiles`, `ceriosMessages`, `getRandomCeriosMessage`) now imported from `@cerios/openapi-core`
- Config loader uses `createConfigLoader` factory from `@cerios/openapi-core`
- Error classes re-exported from `@cerios/openapi-core`

### @cerios/openapi-to-typescript (patch)

- Removed duplicate `batch-executor.ts` - now imports `executeBatch` from `@cerios/openapi-core`
- CLI utilities imported from `@cerios/openapi-core`
- Config loader uses `createConfigLoader` factory from `@cerios/openapi-core`
- Error classes re-exported from `@cerios/openapi-core`

### @cerios/openapi-to-zod-playwright (patch)

- CLI utilities imported from `@cerios/openapi-core`
- Config loader uses `createConfigLoader` factory from `@cerios/openapi-core`
- Error classes now use base classes from `@cerios/openapi-core`
