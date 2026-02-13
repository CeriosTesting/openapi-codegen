/**
 * String utility functions for escaping and formatting
 */

import type { OpenAPISchema } from "../types";

/**
 * Escape string for description in .describe()
 */
export function escapeDescription(str: string): string {
	return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

/**
 * Escape regex pattern for use in code
 * Only escapes forward slashes which would terminate the regex literal
 * Does NOT escape forward slashes inside character classes [...] where they don't need escaping
 * Handles patterns that may already have escaped forward slashes from JSON/YAML
 */
export function escapePattern(str: string): string {
	if (!str) return str;

	let result = "";
	let inCharClass = false;
	let i = 0;

	while (i < str.length) {
		const char = str[i];
		const nextChar = i < str.length - 1 ? str[i + 1] : "";
		const prevChar = i > 0 ? str[i - 1] : "";

		// Track entering/exiting character classes (but not escaped brackets)
		if (char === "[" && prevChar !== "\\") {
			inCharClass = true;
			result += char;
			i++;
		} else if (char === "]" && prevChar !== "\\" && inCharClass) {
			inCharClass = false;
			result += char;
			i++;
		} else if (char === "\\" && nextChar === "/") {
			// Already escaped forward slash
			if (inCharClass) {
				// Inside character class: remove the escape, just output /
				result += "/";
				i += 2; // Skip both \ and /
			} else {
				// Outside character class: keep the escape
				result += "\\/";
				i += 2; // Skip both \ and /
			}
		} else if (char === "/" && prevChar !== "\\") {
			// Unescaped forward slash
			if (inCharClass) {
				// Inside character class: no escaping needed
				result += "/";
			} else {
				// Outside character class: escape it
				result += "\\/";
			}
			i++;
		} else {
			result += char;
			i++;
		}
	}

	return result;
}

/**
 * Escape JSDoc comment content to prevent injection
 */
export function escapeJSDoc(str: string): string {
	return str.replace(/\*\//g, "*\\/");
}

/**
 * Check if schema is nullable (supports both OpenAPI 3.0 and 3.1 syntax)
 * @param schema - The OpenAPI schema to check
 * @param defaultNullable - Default nullable behavior when not explicitly specified (default: false)
 */
export function isNullable(schema: OpenAPISchema, defaultNullable = false): boolean {
	// OpenAPI 3.0 style: nullable explicitly set
	if (schema.nullable === true) {
		return true;
	}
	if (schema.nullable === false) {
		return false;
	}
	// OpenAPI 3.1 style: type can be an array including "null"
	if (Array.isArray(schema.type)) {
		return schema.type.includes("null");
	}
	// No explicit nullable annotation - use default
	return defaultNullable;
}

/**
 * Get the primary type from schema (handles OpenAPI 3.1 type arrays)
 */
export function getPrimaryType(schema: OpenAPISchema): string | undefined {
	if (Array.isArray(schema.type)) {
		// OpenAPI 3.1: type can be an array like ["string", "null"]
		// Return the first non-null type
		const nonNullType = schema.type.find(t => t !== "null");
		return nonNullType;
	}
	return schema.type;
}

/**
 * Check if schema has multiple non-null types
 */
export function hasMultipleTypes(schema: OpenAPISchema): boolean {
	if (Array.isArray(schema.type)) {
		const nonNullTypes = schema.type.filter(t => t !== "null");
		return nonNullTypes.length > 1;
	}
	return false;
}
