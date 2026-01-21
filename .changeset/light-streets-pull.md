---
"@cerios/openapi-to-zod": patch
---

Inline schema code generation now applies the configured prefix and suffix options to schema variable names, ensuring consistent naming between referenced and inline schemas.

Fix for emptyObjectBehavior. Now working correctly

defaultnullable fix for $ref