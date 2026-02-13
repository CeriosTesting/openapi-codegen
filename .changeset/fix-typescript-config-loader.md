---
"@cerios/openapi-core": patch
---

Fix TypeScript config loader to resolve modules from user's project directory

The TypeScript config loader now uses `createRequire(filepath)` to create a require function that resolves modules relative to the config file's location. This fixes the issue where config files importing from packages like `@cerios/openapi-to-typescript` would fail with "Cannot find module" errors because modules were being resolved from the CLI's installation location instead of the user's project.
