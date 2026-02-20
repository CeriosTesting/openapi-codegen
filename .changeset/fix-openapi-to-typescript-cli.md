---
"@cerios/openapi-to-typescript": patch
---

Fix CLI executable configuration and align package.json with other packages

- Switch from ESM (`"type": "module"`) to CommonJS (`"type": "commonjs"`) for consistency
- Fix `bin` field to point to `./dist/cli.js` instead of `./dist/cli.mjs`
- Add `publishConfig`, `bugs`, `homepage` fields
- Add `sideEffects: false` and `./package.json` export
- Update repository URL format to match other packages

This fixes the "npm error could not determine executable to run" error when running `npx openapi-to-typescript`.
