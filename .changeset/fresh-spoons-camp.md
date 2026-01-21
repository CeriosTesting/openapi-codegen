---
"@cerios/openapi-to-zod-playwright": minor
---

Changes the API client generation from optional to mandatory by making the outputClient parameter required in the configuration. This simplifies the architecture by ensuring a consistent three-layer approach: schemas (always generated), client (now always generated), and service (optional).

Updates the CLI initialization flow to require the client output path with proper validation. Removes the conditional logic that previously allowed service generation without a client, as the service layer depends on the client for API calls.

Adds request validation support to the service layer when validateServiceRequest is enabled, covering query parameters, headers, and request bodies. Introduces zodErrorFormat option with three modes (standard, prettify, prettifyWithValues) for customizing validation error messages.

Enhances content type handling with fallbackContentTypeParsing option to specify parsing behavior for unknown content types, with appropriate warnings during generation.

Moves type definitions and helper functions from generated code into the main package exports to reduce code duplication and improve maintainability.

Extracts type aliases (ApiRequestContextOptions, QueryParams, HttpHeaders, etc.) and utility functions (serializeParams, Zod error formatters) from inline definitions in generated client and service files into reusable package exports.

Generated code now imports these utilities from @cerios/openapi-to-zod-playwright instead of duplicating definitions in every generated file, resulting in cleaner output and a single source of truth for shared functionality.

Fix for validateServiceRequest that was not working