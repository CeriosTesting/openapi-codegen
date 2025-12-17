---
"@cerios/openapi-to-zod-playwright": minor
"@cerios/openapi-to-zod": minor
---

Fix for dots in paths and schemas. The ability to strip common path prefixes from OpenAPI paths using the new `stripPathPrefix` option. This results in cleaner generated method names and improved documentation, while maintaining the correct HTTP request paths via the `basePath` option. The implementation includes updates to the code generation logic, configuration schemas, documentation, and peer dependency requirements. Additionally, there are improvements to type handling for schema names in generated TypeScript code.