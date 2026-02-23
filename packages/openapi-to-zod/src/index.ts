/**
 * Public API for @cerios/openapi-to-zod
 *
 * This module exports the stable, documented API surface.
 * These exports follow semantic versioning.
 *
 * For shared utilities (LRUCache, toPascalCase, executeBatch, etc.),
 * import from @cerios/openapi-core instead.
 *
 * @packageDocumentation
 */

// Error classes (re-exported from @cerios/openapi-core)
export {
	CircularReferenceError,
	CliOptionsError,
	ConfigValidationError,
	FileOperationError,
	GeneratorError,
	SchemaGenerationError,
	SpecValidationError,
} from "@cerios/openapi-core";
// Zod-specific generators (for extension packages like openapi-to-zod-playwright)
export { PropertyGenerator, type PropertyGeneratorContext } from "./generators/property-generator";
// Main generator
export { OpenApiGenerator } from "./openapi-generator";
// Types
export type {
	CommonSchemaOptions,
	ConfigFile,
	ExecutionMode,
	InternalOpenApiGeneratorOptions,
	OpenAPIParameter,
	OpenAPIRequestBody,
	OpenAPIResponse,
	OpenAPISchema,
	OpenAPISpec,
	OpenApiGeneratorOptions,
	OperationFilters,
	RequestOptions,
	ResponseOptions,
} from "./types";
export { defineConfig } from "./types";
export { buildDateTimeValidation } from "./validators/string-validator";
