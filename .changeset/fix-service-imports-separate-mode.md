---
"@cerios/openapi-to-zod-playwright": patch
---

Fix service file imports when using separate schemas mode. Types are now correctly imported from the types file (`outputTypes`) instead of the schemas file (`outputZodSchemas`).
