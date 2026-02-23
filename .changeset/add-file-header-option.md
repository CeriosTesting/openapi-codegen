---
"@cerios/openapi-core": minor
"@cerios/openapi-to-zod": minor
"@cerios/openapi-to-typescript": minor
"@cerios/openapi-to-k6": minor
"@cerios/openapi-to-zod-playwright": minor
---

Added `fileHeader` option to add custom comment lines at the top of generated files.

### New Features

**Custom file header support (`@cerios/openapi-core`):**

- Added `generateCustomFileHeader()` utility function
- Added `fileHeader?: string[]` option to `BaseGeneratorOptions`
- Each string in the array is output as-is on its own line at the very top of generated files
- Useful for adding linter disable comments (e.g., oxlint, eslint)

**Config support (all packages):**

- `fileHeader` can be set in `defaults` to apply to all specs
- Individual specs can override or disable (with empty array) the default header

### Example Usage

```typescript
export default defineConfig({
	defaults: {
		fileHeader: [
			"// oxlint-disable typescript/no-unsafe-type-assertion",
			"// oxlint-disable typescript/no-unsafe-assignment",
		],
	},
	specs: [
		{
			input: "api.yaml",
			outputTypes: "schemas.ts",
		},
	],
});
```
