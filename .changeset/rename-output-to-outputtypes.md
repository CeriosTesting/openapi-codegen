---
"@cerios/openapi-core": minor
"@cerios/openapi-to-zod": major
"@cerios/openapi-to-zod-playwright": major
"@cerios/openapi-to-typescript": minor
"@cerios/openapi-to-k6": minor
---

**BREAKING CHANGE**: Renamed `output` property to `outputTypes` in all configuration options

This change improves clarity by explicitly indicating that the output path is for generated types/schemas, distinguishing it from other output options like `outputClient` and `outputService` in the Playwright and K6 packages.

### Migration Guide

Update your configuration files to use `outputTypes` instead of `output`:

**Before:**
```json
{
  "specs": [
    {
      "input": "openapi.yaml",
      "output": "src/schemas.ts"
    }
  ]
}
```

**After:**
```json
{
  "specs": [
    {
      "input": "openapi.yaml",
      "outputTypes": "src/schemas.ts"
    }
  ]
}
```

**TypeScript config:**
```typescript
export default defineConfig({
  specs: [
    {
      input: 'openapi.yaml',
      outputTypes: 'src/schemas.ts', // Previously: output
      outputClient: 'src/client.ts',
      outputService: 'src/service.ts',
    }
  ]
});
```

### Affected Packages

- `@cerios/openapi-core`: `BaseGeneratorOptions.output` → `BaseGeneratorOptions.outputTypes`
- `@cerios/openapi-to-zod`: Config files and `OpenApiGeneratorOptions`
- `@cerios/openapi-to-zod-playwright`: Config files and `OpenApiPlaywrightGeneratorOptions`
- `@cerios/openapi-to-typescript`: Config files and `TypeScriptGeneratorOptions`
- `@cerios/openapi-to-k6`: Config files and `OpenApiK6GeneratorOptions`
