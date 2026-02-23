---
"@cerios/openapi-to-k6": patch
---

Removed unnecessary empty object fallback in header spread

The generated service code now uses `{ ...requestParameters.headers, ...headers }` instead of `{ ...(requestParameters.headers || {}), ...headers }`. Spreading falsy values in object literals is safe and doesn't add unexpected properties, making the fallback redundant.
