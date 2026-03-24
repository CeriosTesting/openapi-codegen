---
"@cerios/openapi-to-zod": minor
"@cerios/openapi-to-zod-playwright": minor
---

Add `uuidFormat` option to configure UUID/GUID validation output

New option `uuidFormat` allows selecting the Zod validator used for `format: "uuid"` and `format: "guid"` fields in OpenAPI specs:

- `"uuid"` (default) — generates `z.uuid()`
- `"guid"` — generates `z.guid()`
- `"uuidv1"` through `"uuidv8"` — generates `z.uuid({ version: "v1" })` etc.

Both `format: "uuid"` and `format: "guid"` in OpenAPI specs follow the configured `uuidFormat` setting.
