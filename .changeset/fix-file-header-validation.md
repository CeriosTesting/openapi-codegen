---
"@cerios/openapi-core": patch
"@cerios/openapi-to-k6": patch
"@cerios/openapi-to-typescript": patch
"@cerios/openapi-to-zod": patch
"@cerios/openapi-to-zod-playwright": patch
---

Fixed `fileHeader` option not being recognized in config validation.

**Bug fix:**

- Added missing `fileHeader` field to `BaseGeneratorOptionsSchema` in openapi-core
- Added missing `showWarnings` field to `BaseGeneratorOptionsSchema` in openapi-core
- Fixed K6 generator `generateString()` and `generateServiceString()` to include file headers in output

This fix ensures the `fileHeader` option works correctly across all packages:

- `@cerios/openapi-to-k6`
- `@cerios/openapi-to-typescript`
- `@cerios/openapi-to-zod`
- `@cerios/openapi-to-zod-playwright`

Previously, using `fileHeader` in a K6 config file would cause validation error:

```
Unrecognized key 'fileHeader'. Check for typos in field names.
```
