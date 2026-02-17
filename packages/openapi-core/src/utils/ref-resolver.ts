/**
 * OpenAPI $ref resolution utilities\n *
 * Provides functions to resolve $ref references to component definitions
 * Supports: parameters, requestBodies, responses, schemas
 */

import type { OpenAPIParameter, OpenAPIRequestBody, OpenAPIResponse, OpenAPISpec } from "../types";

/**
 * Type guard to check if an object has a $ref property
 */
function hasRef(obj: unknown): obj is { $ref: string } {
	return (
		typeof obj === "object" &&
		obj !== null &&
		"$ref" in obj &&
		typeof (obj as Record<string, unknown>).$ref === "string"
	);
}

/**
 * Type guard to check if value is a record object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type for resolved parameters with proper typing
 */
interface ResolvedParameter {
	name: string;
	in: string;
	[key: string]: unknown;
}

/**
 * Type guard to check if a value is a resolved parameter
 */
function isResolvedParameter(value: unknown): value is ResolvedParameter {
	return isRecord(value) && typeof value.name === "string" && typeof value.in === "string";
}

/**
 * Resolve a $ref to a component definition
 * Handles nested $refs by recursively resolving until no more refs found
 *
 * @param obj - Object that may contain a $ref
 * @param spec - The OpenAPI specification
 * @param maxDepth - Maximum recursion depth to prevent infinite loops (default: 10)
 * @returns The resolved component, or the original object if not a reference
 * @internal
 */
export function resolveRef<T>(obj: T | { $ref: string }, spec: OpenAPISpec, maxDepth = 10): T {
	// Intentional cast: Caller asserts expected type via generic parameter
	// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
	if (!obj || typeof obj !== "object" || maxDepth <= 0) return obj as T;
	// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
	if (!hasRef(obj)) return obj as T;

	const ref = obj.$ref;
	let resolved: unknown = null;

	// Match different component types
	const paramMatch = ref.match(/^#\/components\/parameters\/(.+)$/);
	const requestBodyMatch = ref.match(/^#\/components\/requestBodies\/(.+)$/);
	const responseMatch = ref.match(/^#\/components\/responses\/(.+)$/);
	const schemaMatch = ref.match(/^#\/components\/schemas\/(.+)$/);

	if (paramMatch && spec.components?.parameters) {
		const name = paramMatch[1];
		resolved = spec.components.parameters[name];
	} else if (requestBodyMatch && spec.components?.requestBodies) {
		const name = requestBodyMatch[1];
		resolved = spec.components.requestBodies[name];
	} else if (responseMatch && spec.components?.responses) {
		const name = responseMatch[1];
		resolved = spec.components.responses[name];
	} else if (schemaMatch && spec.components?.schemas) {
		const name = schemaMatch[1];
		resolved = spec.components.schemas[name];
	}

	if (resolved) {
		// Recursively resolve nested $refs
		if (hasRef(resolved)) {
			return resolveRef<T>(resolved, spec, maxDepth - 1);
		}
		// Intentional cast: Caller asserts expected type via generic parameter
		// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
		return resolved as T;
	}

	// Return original if can't resolve - intentional cast to caller's expected type
	// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
	return obj as T;
}

/**
 * Resolve a parameter reference
 * Convenience wrapper for resolveRef with parameter type
 * @internal
 */
export function resolveParameterRef(param: unknown, spec: OpenAPISpec): OpenAPIParameter {
	// Intentional cast: Function accepts unknown to support refs and objects
	// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
	return resolveRef<OpenAPIParameter>(param as OpenAPIParameter | { $ref: string }, spec);
}

/**
 * Resolve a request body reference
 * Convenience wrapper for resolveRef with request body type
 */
export function resolveRequestBodyRef(requestBody: unknown, spec: OpenAPISpec): OpenAPIRequestBody {
	// Intentional cast: Function accepts unknown to support refs and objects
	// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
	return resolveRef<OpenAPIRequestBody>(requestBody as OpenAPIRequestBody | { $ref: string }, spec);
}

/**
 * Resolve a response reference
 * Convenience wrapper for resolveRef with response type
 */
export function resolveResponseRef(response: unknown, spec: OpenAPISpec): OpenAPIResponse {
	// Intentional cast: Function accepts unknown to support refs and objects
	// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion)
	return resolveRef<OpenAPIResponse>(response as OpenAPIResponse | { $ref: string }, spec);
}

/**
 * Merge path-level parameters with operation-level parameters
 * Operation parameters override path-level parameters with the same name and location
 *
 * @param pathParams - Parameters defined at the path level
 * @param operationParams - Parameters defined at the operation level
 * @param spec - The OpenAPI specification for resolving $refs
 * @returns Merged array of resolved parameters
 */
export function mergeParameters(
	pathParams: unknown[] | undefined,
	operationParams: unknown[] | undefined,
	spec: OpenAPISpec
): unknown[] {
	const resolvedPathParams = (pathParams || []).map(p => resolveParameterRef(p, spec));
	const resolvedOperationParams = (operationParams || []).map(p => resolveParameterRef(p, spec));

	// Start with path-level params
	const merged: unknown[] = [...resolvedPathParams];

	// Operation params override path params by name + in
	for (const opParam of resolvedOperationParams) {
		if (!isResolvedParameter(opParam)) continue;

		const existingIndex = merged.findIndex(
			p => isResolvedParameter(p) && p.name === opParam.name && p.in === opParam.in
		);

		if (existingIndex >= 0) {
			// Override existing param
			merged[existingIndex] = opParam;
		} else {
			// Add new param
			merged.push(opParam);
		}
	}

	return merged;
}
