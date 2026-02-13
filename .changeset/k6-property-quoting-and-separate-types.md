---
"@cerios/openapi-to-k6": minor
---

### Features

- Add `outputTypes` option to generate TypeScript types in a separate file
  - When specified, parameter types (e.g., `GetUsersParams`, `GetUsersHeaders`) are generated to a separate file
  - The client file imports types from the separate file
  - CLI flag: `-t, --output-types <path>`
  - Config: `outputTypes: "k6/api-types.ts"`

### Bug Fixes

- Fix property quoting for parameter names with special characters
  - Property names like `filter[id]`, `page[number]`, and headers with dashes are now properly quoted
  - Before: `filter[id]?: string;` (invalid TypeScript)
  - After: `"filter[id]"?: string;` (valid TypeScript)
