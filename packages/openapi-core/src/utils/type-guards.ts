/**
 * Type guards for OpenAPI structures
 *
 * Shared type guards for safely narrowing OpenAPI specification types
 */

import type { HttpMethod } from "../types";

/**
 * OpenAPI operation structure for type checking
 */
export interface OpenAPIOperationLike {
	operationId?: string;
	deprecated?: boolean;
	summary?: string;
	description?: string;
	parameters?: unknown[];
	requestBody?: unknown;
	responses?: Record<string, unknown>;
}

/**
 * OpenAPI path item structure for type checking
 */
export interface PathItemLike extends Record<string, unknown> {
	parameters?: unknown[];
}

/**
 * Type guard to check if a value is an OpenAPI operation
 *
 * @param value - The value to check
 * @returns True if the value is an object that can be treated as an operation
 *
 * @example
 * const pathItem = spec.paths["/users"];
 * const operation = pathItem["get"];
 * if (isOpenAPIOperation(operation)) {
 *   console.log(operation.operationId);
 * }
 */
export function isOpenAPIOperation(value: unknown): value is OpenAPIOperationLike {
	return typeof value === "object" && value !== null;
}

/**
 * Type guard to check if a value is an OpenAPI path item
 *
 * @param value - The value to check
 * @returns True if the value is an object that can be treated as a path item
 *
 * @example
 * for (const [path, pathItem] of Object.entries(spec.paths)) {
 *   if (isPathItemLike(pathItem)) {
 *     // Safe to access path item properties
 *   }
 * }
 */
export function isPathItemLike(value: unknown): value is PathItemLike {
	return typeof value === "object" && value !== null;
}

/**
 * Helper to safely get an operation from a path item
 *
 * @param pathItem - The path item object
 * @param method - The HTTP method to retrieve
 * @returns The operation if it exists and is valid, undefined otherwise
 *
 * @example
 * const pathItem = spec.paths["/users"];
 * const getOperation = getOperation(pathItem, "get");
 * if (getOperation) {
 *   console.log(getOperation.operationId);
 * }
 */
export function getOperation(pathItem: Record<string, unknown>, method: HttpMethod): OpenAPIOperationLike | undefined {
	const operation = pathItem[method];
	return isOpenAPIOperation(operation) ? operation : undefined;
}
