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
}

/**
 * Root configuration file structure
 */
export interface ConfigFile {
	/**
	 * Global default options applied to all specifications
	 * Can be overridden by individual specification configurations
	 */
	defaults?: Partial<Omit<OpenApiGeneratorOptions, "input" | "outputTypes">>;

	/**
	 * Array of OpenAPI specifications to process
	 * Each specification must have input and output paths
	 */
	specs: OpenApiGeneratorOptions[];

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
