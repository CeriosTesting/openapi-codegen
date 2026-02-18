/**
 * Schema utilities
 *
 * Utilities for working with OpenAPI schemas including type conversion
 * and type guards for resolved schema structures.
 */

/**
 * OpenAPI schema structure for type conversion
 *
 * Simplified schema type for converting to TypeScript type strings.
 */
export interface OpenAPISchemaLike {
	/** Reference to another schema */
	$ref?: string;
	/** Schema type */
	type?: "string" | "number" | "integer" | "boolean" | "array" | "object" | "null";
	/** Enum values for string types */
	enum?: string[];
	/** Items schema for array types */
	items?: OpenAPISchemaLike;
	/** Additional properties schema or boolean for object types */
	additionalProperties?: OpenAPISchemaLike | boolean;
}

/**
 * Resolved request body structure
 */
export interface ResolvedRequestBody {
	/** Content type map */
	content?: Record<string, unknown>;
	/** Whether the request body is required */
	required?: boolean;
}

/**
 * Type guard for resolved request body
 *
 * @param value - The value to check
 * @returns True if the value is a resolved request body
 */
export function isResolvedRequestBody(value: unknown): value is ResolvedRequestBody {
	return typeof value === "object" && value !== null && "content" in value;
}

/**
 * Resolved response structure
 */
export interface ResolvedResponse {
	/** Content type map */
	content?: Record<string, unknown>;
}

/**
 * Type guard for resolved response
 *
 * @param value - The value to check
 * @returns True if the value is a resolved response
 */
export function isResolvedResponse(value: unknown): value is ResolvedResponse {
	return typeof value === "object" && value !== null && "content" in value;
}

/**
 * Media type content with optional schema
 */
export interface MediaTypeContent {
	/** Schema for the media type */
	schema?: OpenAPISchemaLike;
}

/**
 * Type guard for media type content
 *
 * @param value - The value to check
 * @returns True if the value is media type content
 */
export function isMediaTypeContent(value: unknown): value is MediaTypeContent {
	return typeof value === "object" && value !== null;
}

/**
 * Type guard for OpenAPI parameter
 *
 * Checks if a value has the required `name` and `in` properties
 * that define an OpenAPI parameter.
 *
 * @param value - The value to check
 * @returns True if the value is an OpenAPI parameter
 */
export function isOpenAPIParameter(
	value: unknown
): value is { name: string; in: string; required?: boolean; schema?: unknown; description?: string } {
	return typeof value === "object" && value !== null && "name" in value && "in" in value;
}

/**
 * Converts OpenAPI schema type to TypeScript type string
 *
 * Handles primitive types, arrays, objects, refs, and enums.
 * Falls back to "unknown" for undefined or unrecognized schemas.
 *
 * @param schema - The OpenAPI schema to convert
 * @returns TypeScript type string representation
 *
 * @example
 * ```typescript
 * schemaToTypeString({ type: "string" }) // "string"
 * schemaToTypeString({ type: "integer" }) // "number"
 * schemaToTypeString({ type: "array", items: { type: "string" } }) // "string[]"
 * schemaToTypeString({ $ref: "#/components/schemas/User" }) // "User"
 * schemaToTypeString({ type: "string", enum: ["a", "b"] }) // '"a" | "b"'
 * ```
 */
export function schemaToTypeString(schema: OpenAPISchemaLike | undefined): string {
	if (!schema) return "unknown";

	if (schema.$ref) {
		// Extract type name from ref
		const parts = schema.$ref.split("/");
		return parts[parts.length - 1];
	}

	switch (schema.type) {
		case "integer":
		case "number":
			return "number";
		case "boolean":
			return "boolean";
		case "string":
			if (schema.enum) {
				return schema.enum.map((v: string) => `"${v}"`).join(" | ");
			}
			return "string";
		case "array":
			return `${schemaToTypeString(schema.items)}[]`;
		case "object":
			if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
				return `Record<string, ${schemaToTypeString(schema.additionalProperties)}>`;
			}
			return "Record<string, unknown>";
		case "null":
		case undefined:
			return "unknown";
	}
}
