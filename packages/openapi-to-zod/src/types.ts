/**
 * Re-export core types from @cerios/openapi-core
 */
export type {
	BaseGeneratorOptions,
	ExecutionMode,
	OpenAPIParameter,
	OpenAPIRequestBody,
	OpenAPIResponse,
	OpenAPISchema,
	OpenAPISpec,
	OperationFilters,
} from "@cerios/openapi-core";

// Import types for local use within this file
import type { BaseGeneratorOptions, ExecutionMode } from "@cerios/openapi-core";

/**
 * Common options shared by both request and response contexts
 */
export interface CommonSchemaOptions {
	/**
	 * Object validation mode
	 * - 'strict': Uses z.strictObject() - no additional properties allowed
	 * - 'normal': Uses z.object() - additional properties allowed
	 * - 'loose': Uses z.looseObject() - explicitly allows additional properties
	 */
	mode?: "strict" | "normal" | "loose";

	/**
	 * Whether to add .describe() calls for better error messages
	 * @default false
	 */
	useDescribe?: boolean;

	/**
	 * Whether to include descriptions as JSDoc comments
	 */
	includeDescriptions?: boolean;

	/**
	 * Default nullable behavior when not explicitly specified in the schema
	 *
	 * When true: Properties without explicit nullable annotation are treated as nullable.
	 * This follows the industry de facto standard for OpenAPI 3.0.x where tooling convergence
	 * made "nullable by default" the safest assumption.
	 *
	 * When false (default): Properties are only nullable when explicitly marked with `nullable: true`
	 * (OpenAPI 3.0) or `type: ["string", "null"]` (OpenAPI 3.1).
	 *
	 * @default false
	 */
	defaultNullable?: boolean;

	/**
	 * Behavior for empty object schemas (objects with no properties defined)
	 *
	 * - 'strict': Uses z.strictObject({}) - no additional properties allowed
	 * - 'loose': Uses z.looseObject({}) - explicitly allows additional properties (Zod v4)
	 * - 'record': Uses z.record(z.string(), z.unknown()) - treat as arbitrary key-value map
	 *
	 * Note: This option controls nested/property-level empty objects.
	 * The top-level `mode` option controls how schema definitions are wrapped.
	 *
	 * @default 'loose'
	 */
	emptyObjectBehavior?: "strict" | "loose" | "record";
}

/**
 * Request-specific options that can override root-level options
 */
export interface RequestOptions extends CommonSchemaOptions {
	// All options inherited from CommonSchemaOptions
}

/**
 * Response-specific options that can override root-level options
 */
export interface ResponseOptions extends CommonSchemaOptions {
	// All options inherited from CommonSchemaOptions
}

/**
 * Options for Zod schema generation from OpenAPI specifications
 *
 * Extends BaseGeneratorOptions from @cerios/openapi-core with Zod-specific options.
 */
export interface OpenApiGeneratorOptions extends BaseGeneratorOptions {
	/**
	 * Object validation mode
	 * - 'strict': Uses z.strictObject() - no additional properties allowed
	 * - 'normal': Uses z.object() - additional properties allowed
	 * - 'loose': Uses z.looseObject() - explicitly allows additional properties
	 */
	mode?: "strict" | "normal" | "loose";

	/**
	 * Whether to add .describe() calls for better error messages
	 * @default false
	 */
	useDescribe?: boolean;

	/**
	 * Behavior for empty object schemas (objects with no properties defined)
	 *
	 * - 'strict': Uses z.strictObject({}) - no additional properties allowed
	 * - 'loose': Uses z.looseObject({}) - explicitly allows additional properties (Zod v4)
	 * - 'record': Uses z.record(z.string(), z.unknown()) - treat as arbitrary key-value map
	 *
	 * Note: This option controls nested/property-level empty objects.
	 * The top-level `mode` option controls how schema definitions are wrapped.
	 *
	 * @default 'loose'
	 */
	emptyObjectBehavior?: "strict" | "loose" | "record";

	/**
	 * Schema filtering mode
	 * - 'all': Generate all schemas (default)
	 * - 'request': Only include schemas suitable for requests (excludes readOnly)
	 * - 'response': Only include schemas suitable for responses (excludes writeOnly)
	 */
	schemaType?: "all" | "request" | "response";

	/**
	 * Fallback parsing method for unknown or missing content types
	 *
	 * When a content type is not recognized, this determines how the response is parsed:
	 * - "text": Use response.text() - safest, always succeeds (default)
	 * - "json": Use response.json() - may throw if response isn't valid JSON
	 * - "body": Use response.body() - returns raw Buffer
	 *
	 * A warning will be logged during generation when an unknown content type is encountered.
	 *
	 * @default "text"
	 */
	fallbackContentTypeParsing?: "text" | "json" | "body";

	/**
	 * Request-specific options that override root-level options
	 * Applied when schemas are used in request contexts
	 */
	request?: RequestOptions;

	/**
	 * Response-specific options that override root-level options
	 * Applied when schemas are used in response contexts
	 */
	response?: ResponseOptions;

	/**
	 * Header parameters to ignore during schema generation
	 * Supports glob patterns for flexible matching
	 * Case-insensitive matching (HTTP header semantics)
	 *
	 * @internal Used by Playwright generator
	 */
	ignoreHeaders?: string[];

	/**
	 * Cache size for pattern regex compilation
	 * Higher values improve performance for large specifications with many string patterns
	 * @default 1000
	 */
	cacheSize?: number;

	/**
	 * Custom regex pattern for date-time format validation
	 * Overrides the default z.iso.datetime() which requires ISO 8601 format with timezone suffix (Z)
	 *
	 * **Config File Formats:**
	 * - JSON/YAML configs: Must use string pattern (requires double-escaping: `\\d`)
	 * - TypeScript configs: Can use either string pattern OR RegExp literal (`/\d/`)
	 *
	 * **Common Patterns:**
	 * ```typescript
	 * // No timezone suffix (e.g., "2026-01-07T14:30:00")
	 * customDateTimeFormatRegex: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$'
	 * // OR in TypeScript config:
	 * customDateTimeFormatRegex: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/
	 *
	 * // With milliseconds, no Z (e.g., "2026-01-07T14:30:00.123")
	 * customDateTimeFormatRegex: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}$'
	 *
	 * // Optional Z suffix (e.g., "2026-01-07T14:30:00" or "2026-01-07T14:30:00Z")
	 * customDateTimeFormatRegex: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z?$'
	 * ```
	 *
	 * @default "z.iso.datetime()" (requires Z suffix per ISO 8601)
	 */
	customDateTimeFormatRegex?: string | RegExp;

	/**
	 * Output path for Zod schemas when using separate type/schema files.
	 *
	 * When specified:
	 * - TypeScript types are generated to `outputTypes` (using @cerios/openapi-to-typescript)
	 * - Zod schemas are generated to `outputZodSchemas` with explicit type annotations
	 *
	 * This approach solves "Type instantiation is excessively deep" errors that occur
	 * with very large or deeply nested schemas when using `z.infer<typeof schema>`.
	 *
	 * Instead of generating:
	 * ```typescript
	 * export const userSchema = z.object({ ... });
	 * export type User = z.infer<typeof userSchema>; // Can cause TS errors
	 * ```
	 *
	 * Generates two files:
	 * ```typescript
	 * // types.ts
	 * export type User = { ... };
	 *
	 * // schemas.ts
	 * import type { User } from './types';
	 * export const userSchema: z.ZodType<User> = z.object({ ... });
	 * ```
	 *
	 * @example
	 * ```typescript
	 * {
	 *   input: 'openapi.yaml',
	 *   outputTypes: 'src/generated/types.ts',
	 *   outputZodSchemas: 'src/generated/schemas.ts'
	 * }
	 * ```
	 */
	outputZodSchemas?: string;

	/**
	 * Format for generating enums in TypeScript types (when using outputZodSchemas)
	 * - 'union': Generate union of string literals
	 * - 'const-object': Generate const object with derived type (default)
	 *
	 * This option is passed to @cerios/openapi-to-typescript when generating types.
	 *
	 * @default 'const-object'
	 */
	enumFormat?: "union" | "const-object";

	/**
	 * Complexity threshold for switching from type annotation (`:`) to double assertion (`as unknown as`)
	 * in generated z.ZodType<T> declarations (only applies when outputZodSchemas is used).
	 *
	 * - When not set or 0: Always use annotation syntax `: z.ZodType<T>`
	 * - When set to a positive number: Use double assertion `as unknown as z.ZodType<T>` for schemas
	 *   with complexity >= threshold, annotation syntax for simpler schemas
	 *
	 * Type annotation (`:`) provides full TypeScript type checking but can cause
	 * "Type instantiation is excessively deep" errors on very large/complex schemas.
	 * Double assertion via `unknown` completely bypasses TypeScript's structural checking,
	 * ensuring compilation even for extremely large schemas.
	 *
	 * Complexity is calculated as: properties + (nested levels * 10) + (array/union members * 2)
	 *
	 * @example
	 * // Always use annotation (default, safest)
	 * typeAssertionThreshold: 0
	 *
	 * // Use double assertion for complex schemas (when experiencing TS depth errors)
	 * typeAssertionThreshold: 100
	 *
	 * @default 0 (always use annotation)
	 */
	typeAssertionThreshold?: number;
}

/**
 * Internal options that extend public options with internal-only properties
 * @internal
 */
export interface InternalOpenApiGeneratorOptions extends OpenApiGeneratorOptions {
	/**
	 * Whether to include the auto-generated header comment in output
	 * Used internally by downstream packages for consistent branding
	 * @internal
	 */
	includeHeader?: boolean;
}

/**
 * Root configuration file structure
 */
export interface ConfigFile {
	/**
	 * Global default options applied to all specifications
	 * Can be overridden by individual specification configurations
	 */
	defaults?: Partial<Omit<OpenApiGeneratorOptions, "input" | "outputTypes" | "outputZodSchemas">>;

	/**
	 * Array of OpenAPI specifications to process
	 * Each specification must provide `input` and at least one of:
	 * - `outputTypes` (preferred) - generates combined types+schemas OR just types (when outputZodSchemas is used)
	 * - `output` (deprecated alias for outputTypes)
	 * - `outputZodSchemas` (optional) - when specified, schemas go here with z.ZodType<TypeAlias> syntax
	 */
	specs: (Omit<OpenApiGeneratorOptions, "outputTypes"> & {
		outputTypes?: string;
		/**
		 * @deprecated Use `outputTypes` instead.
		 */
		output?: string;
	})[];

	/**
	 * Execution mode for batch processing
	 * @default "parallel"
	 */
	executionMode?: ExecutionMode;
}

/**
 * Resolved options for a specific schema context (request or response)
 * All optional fields are required here
 */
export interface ResolvedOptions {
	mode: "strict" | "normal" | "loose";
	useDescribe: boolean;
	includeDescriptions: boolean;
}

/**
 * Helper function for type-safe config file creation
 * Provides IDE autocomplete and type checking for config files
 *
 * @example
 * ```typescript
 * import { defineConfig } from '@cerios/openapi-to-zod';
 *
 * export default defineConfig({
 *   defaults: {
 *     mode: 'strict',
 *     includeDescriptions: true
 *   },
 *   specs: [
 *     { input: 'api-v1.yaml', outputTypes: 'schemas/v1.ts' },
 *     { input: 'api-v2.yaml', outputTypes: 'schemas/v2.ts', mode: 'normal' }
 *   ]
 * });
 * ```
 */
export function defineConfig(config: ConfigFile): ConfigFile {
	return config;
}
