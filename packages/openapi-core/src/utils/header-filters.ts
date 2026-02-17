/**
 * Header filtering utilities for API client generation
 *
 * Provides utilities for filtering HTTP headers based on patterns.
 * Useful for excluding authentication headers, standard headers, etc.
 */

import { minimatch } from "minimatch";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

/** Operation with parameters */
interface OperationWithParams {
	parameters?: unknown[];
}

/** Parameter with in and name properties */
interface HeaderParam {
	in: "header";
	name: string;
}

/** Type guard for operation with parameters */
function isOperationWithParams(value: unknown): value is OperationWithParams {
	if (typeof value !== "object" || value === null || !("parameters" in value)) {
		return false;
	}
	const params = (value as Record<string, unknown>).parameters;
	return Array.isArray(params);
}

/** Type guard for header parameter */
function isHeaderParam(value: unknown): value is HeaderParam {
	return (
		typeof value === "object" &&
		value !== null &&
		"in" in value &&
		(value as { in: unknown }).in === "header" &&
		"name" in value &&
		typeof (value as { name: unknown }).name === "string"
	);
}

/** Type guard for Record */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * Check if a header should be ignored based on filter patterns
 *
 * Supports glob patterns and case-insensitive matching (HTTP header semantics).
 *
 * @param headerName - The header name to check (e.g., "Authorization", "X-API-Key")
 * @param ignorePatterns - Array of patterns to match against (supports glob patterns)
 * @returns true if the header should be ignored, false otherwise
 *
 * @example
 * shouldIgnoreHeader("Authorization", ["authorization"]) // true
 * shouldIgnoreHeader("X-Custom-Header", ["x-*"]) // true
 * shouldIgnoreHeader("Content-Type", ["*"]) // true
 */
export function shouldIgnoreHeader(headerName: string, ignorePatterns?: string[]): boolean {
	if (!ignorePatterns || ignorePatterns.length === 0) {
		return false;
	}

	// Wildcard pattern - ignore all headers
	if (ignorePatterns.includes("*")) {
		return true;
	}

	// Case-insensitive matching (HTTP header standard)
	const headerLower = headerName.toLowerCase();

	return ignorePatterns.some(pattern => {
		const patternLower = pattern.toLowerCase();
		return minimatch(headerLower, patternLower);
	});
}

/**
 * Filter header parameters based on ignore patterns
 *
 * Returns only headers that should NOT be ignored.
 *
 * @param headers - Array of header parameter objects with 'name' property
 * @param ignorePatterns - Array of patterns to match against
 * @returns Filtered array excluding ignored headers
 *
 * @example
 * const headers = [{ name: "Authorization" }, { name: "X-API-Key" }];
 * filterHeaders(headers, ["authorization"]) // [{ name: "X-API-Key" }]
 */
export function filterHeaders<T extends { name: string }>(headers: T[], ignorePatterns?: string[]): T[] {
	if (!ignorePatterns || ignorePatterns.length === 0) {
		return headers;
	}

	return headers.filter(header => !shouldIgnoreHeader(header.name, ignorePatterns));
}

/**
 * Collect all unique header names from OpenAPI spec operations
 *
 * Used internally for validation and warnings about unmatched patterns.
 *
 * @param spec - OpenAPI specification object
 * @returns Set of all header parameter names found in the spec (lowercase)
 * @internal
 */
function collectAllHeaderNames(spec: { paths?: Record<string, unknown> }): Set<string> {
	const headerNames = new Set<string>();

	if (!spec.paths) {
		return headerNames;
	}

	for (const pathItem of Object.values(spec.paths)) {
		if (!isRecord(pathItem)) continue;

		for (const method of HTTP_METHODS) {
			const operation = pathItem[method];
			if (!isOperationWithParams(operation)) continue;

			for (const param of operation.parameters ?? []) {
				if (isHeaderParam(param)) {
					headerNames.add(param.name.toLowerCase());
				}
			}
		}
	}

	return headerNames;
}

/**
 * Validate ignore patterns and warn about patterns that don't match any headers
 *
 * Helps catch typos and configuration mistakes by warning when patterns
 * don't match any headers in the OpenAPI spec.
 *
 * @param ignorePatterns - Patterns to validate
 * @param spec - OpenAPI specification object
 * @param packageName - Name of the package for warning messages (default: "openapi-core")
 *
 * @example
 * validateIgnorePatterns(["x-custom-*"], spec, "openapi-to-zod-playwright");
 * // Logs warning if no headers match the pattern
 */
export function validateIgnorePatterns(
	ignorePatterns: string[] | undefined,
	spec: { paths?: Record<string, unknown> },
	packageName = "openapi-core"
): void {
	if (!ignorePatterns || ignorePatterns.length === 0) {
		return;
	}

	// Wildcard matches everything, no need to validate
	if (ignorePatterns.includes("*")) {
		return;
	}

	const allHeaders = collectAllHeaderNames(spec);

	if (allHeaders.size === 0) {
		console.warn(
			`[${packageName}] Warning: ignoreHeaders specified but no header parameters found in spec. ` +
				`Patterns will have no effect: ${ignorePatterns.join(", ")}`
		);
		return;
	}

	// Check each pattern
	for (const pattern of ignorePatterns) {
		const patternLower = pattern.toLowerCase();
		let matched = false;

		for (const headerName of allHeaders) {
			if (minimatch(headerName, patternLower)) {
				matched = true;
				break;
			}
		}

		if (!matched) {
			console.warn(
				`[${packageName}] Warning: ignoreHeaders pattern "${pattern}" ` +
					`does not match any header parameters in the spec. ` +
					`Available headers: ${Array.from(allHeaders).join(", ")}`
			);
		}
	}
}
