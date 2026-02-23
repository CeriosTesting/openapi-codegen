---
"@cerios/openapi-core": minor
"@cerios/openapi-to-typescript": patch
"@cerios/openapi-to-zod": minor
"@cerios/openapi-to-zod-playwright": patch
"@cerios/openapi-to-k6": patch
---

Added aligned file headers and configurable warning system across all packages.

### Breaking Changes

**`generateFileHeader()` return type changed (`@cerios/openapi-core`):**

- Changed return type from `string[]` to `string`
- Function now returns a formatted string with trailing double newline (`\n\n`)
- All generators updated to use the new return type

### New Features

**Aligned header generation (`@cerios/openapi-core`):**

- `generateFileHeader()` now returns a formatted string ready to prepend to generated files
- Headers include package name, API title/version (when available), and "do not edit" notice
- All generators now include API metadata (title/version) from the OpenAPI spec in generated file headers

**Warning collector system (`@cerios/openapi-core`):**

- Added `WarningCollector` class for deferred warning output
- Added `createWarningLogger()` factory for direct warning logging
- Warnings are now displayed in a dedicated section at the end of generation with `⚠️` prefix
- Added `showWarnings` option to `BaseGeneratorOptions` (default: `true`)

**Composition warnings wired through generators (`@cerios/openapi-to-zod`):**

- allOf conflict warnings now flow through `WarningCollector`
- Empty oneOf/anyOf warnings now flow through `WarningCollector`
- Discriminator fallback warnings now flow through `WarningCollector`
- Added `warn` callback to `PropertyGeneratorContext` and `CompositionValidatorContext`

### Usage

To disable warnings during generation:

```typescript
const generator = new ZodGenerator({
	input: "openapi.yaml",
	outputTypes: "types.ts",
	showWarnings: false, // Suppress warning output
});
```

### Internal Changes

- `validateFilters()` and `validateIgnorePatterns()` now accept optional `warn` callback parameter
- All generator classes use `WarningCollector` for coordinated warning output
- Composition validators receive `warn` function through context
- Removed private `generateFileHeader()` wrapper method from openapi-to-k6
