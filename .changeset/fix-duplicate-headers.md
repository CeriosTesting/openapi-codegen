---
"@cerios/openapi-to-typescript": patch
"@cerios/openapi-to-zod": patch
"@cerios/openapi-to-zod-playwright": patch
"@cerios/openapi-to-k6": patch
---

Fixed duplicate header comments in generated files:

- **openapi-to-k6**: Types file no longer shows both `@cerios/openapi-to-k6` and `@cerios/openapi-to-typescript` headers
- **openapi-to-zod**: Types file (when using `outputZodSchemas`) now shows `@cerios/openapi-to-zod` header instead of `@cerios/openapi-to-typescript`
- **openapi-to-zod-playwright**: Types and schemas files now show `@cerios/openapi-to-zod-playwright` header consistently

Added internal `includeHeader` option for downstream package coordination:

- `InternalTypeScriptGeneratorOptions` in openapi-to-typescript
- `InternalOpenApiGeneratorOptions` in openapi-to-zod

These internal types are exported but not part of the public API - they allow downstream generators to suppress headers and add their own branding.
