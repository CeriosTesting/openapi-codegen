---
"@cerios/openapi-to-zod-playwright": minor
"@cerios/openapi-to-zod": minor
---

Options to set default nullable for properties. QueryParams for GET operations will now succesfully be generated when no operationId is supplied, will successfully fallback to path naming, Add stripPathPrefix option to OpenApiGenerator for improved query/header parameter naming

Makes the client property private by prefixing with underscore, following TypeScript conventions for private members that shouldn't be accessed externally.

Updates JSDoc @returns tags to show actual type names instead of HTTP status descriptions, providing more useful documentation for developers consuming the generated service methods.

Removes unnecessary explicit return statements from void methods, as TypeScript functions without a return value don't require them.

Ensures the required @cerios/openapi-to-zod peer dependency is installed before the package attempts to use it. Introduces an early runtime check that validates dependency availability and throws a descriptive error if missing.