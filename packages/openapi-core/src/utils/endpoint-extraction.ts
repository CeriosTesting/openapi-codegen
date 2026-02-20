/**
 * Endpoint extraction utilities
 *
 * Shared types and functions for extracting endpoint information from OpenAPI specs.
 * Used by k6 and other generators that need simplified endpoint metadata.
 */

import type { OpenAPISpec, OperationFilters } from "../types";
import { HTTP_METHODS } from "../types";

import { selectContentType } from "./content-type-utils";
import { filterHeaders } from "./header-filters";
import { extractPathParams, generateHttpMethodName, sanitizeOperationId } from "./method-naming";
import { shouldIncludeOperation } from "./operation-filters";
import { stripPathPrefix } from "./pattern-utils";
import { mergeParameters, resolveRequestBodyRef, resolveResponseRef } from "./ref-resolver";
import {
	isMediaTypeContent,
	isResolvedRequestBody,
	isResolvedResponse,
	schemaToTypeString,
	type OpenAPISchemaLike,
} from "./schema-utils";
import { getOperation, isPathItemLike } from "./type-guards";

/** Type guard for OpenAPI parameter - used for filtering merged parameters */
function isOpenAPIParameterLike(
	value: unknown
): value is { name: string; in: string; required?: boolean; schema?: OpenAPISchemaLike; description?: string } {
	return typeof value === "object" && value !== null && "name" in value && "in" in value;
}

/**
 * Simplified parameter information for endpoint extraction
 */
export interface ParameterInfo {
	/** Parameter name */
	name: string;
	/** Whether the parameter is required */
	required: boolean;
	/** TypeScript type string representation */
	type: string;
	/** Parameter description */
	description?: string;
}

/**
 * Request body information for endpoint extraction
 */
export interface RequestBodyInfo {
	/** Whether the request body is required */
	required: boolean;
	/** Content type of the request body */
	contentType: string;
	/** TypeScript type name for the request body */
	typeName: string;
}

/**
 * Endpoint information extracted from OpenAPI spec
 *
 * Contains all metadata needed for generating client/service methods.
 */
export interface EndpointInfo {
	/** The API path (e.g., "/users/{id}") */
	path: string;
	/** HTTP method (lowercase, e.g., "get", "post") */
	method: string;
	/** Generated method name for code generation */
	methodName: string;
	/** Path parameter names extracted from the path */
	pathParams: string[];
	/** Query parameters with type information */
	queryParams: ParameterInfo[];
	/** Header parameters with type information */
	headerParams: ParameterInfo[];
	/** Request body information if present */
	requestBody?: RequestBodyInfo;
	/** TypeScript type string for the success response */
	successResponseType?: string;
	/** HTTP status code for the success response */
	successStatusCode?: number;
	/** Whether the operation is deprecated */
	deprecated?: boolean;
	/** Operation summary */
	summary?: string;
	/** Operation description */
	description?: string;
}

/**
 * Options for extractEndpoints function
 */
export interface ExtractEndpointsOptions {
	/** Whether to use operationId for method names */
	useOperationId?: boolean;
	/** Operation filters to apply */
	operationFilters?: OperationFilters;
	/** Headers to ignore (patterns or exact names) */
	ignoreHeaders?: string[];
	/** Path prefix to strip */
	stripPathPrefix?: string;
	/** Preferred content types in order of preference */
	preferredContentTypes?: string[];
	/** Whether to track success status code (default: false) */
	trackStatusCode?: boolean;
}

/**
 * Extracts all endpoints from an OpenAPI spec
 *
 * Processes the OpenAPI spec and returns simplified endpoint information
 * suitable for code generation. Applies filtering and naming transformations.
 *
 * @param spec - The OpenAPI specification
 * @param options - Extraction options
 * @returns Array of endpoint information
 *
 * @example
 * ```typescript
 * const endpoints = extractEndpoints(spec, {
 *   useOperationId: true,
 *   operationFilters: { includePaths: ["/users/**"] },
 *   preferredContentTypes: ["application/json"],
 * });
 *
 * for (const endpoint of endpoints) {
 *   console.log(`${endpoint.method.toUpperCase()} ${endpoint.path} -> ${endpoint.methodName}`);
 * }
 * ```
 */
export function extractEndpoints(spec: OpenAPISpec, options: ExtractEndpointsOptions = {}): EndpointInfo[] {
	const endpoints: EndpointInfo[] = [];
	const {
		useOperationId = false,
		operationFilters,
		ignoreHeaders,
		stripPathPrefix: pathPrefix,
		preferredContentTypes = ["application/json"],
		trackStatusCode = false,
	} = options;

	if (!spec.paths) {
		return endpoints;
	}

	for (const [originalPath, pathItem] of Object.entries(spec.paths)) {
		if (!isPathItemLike(pathItem)) continue;

		// Strip prefix from path for processing
		const path = stripPathPrefix(originalPath, pathPrefix);

		for (const method of HTTP_METHODS) {
			const operation = getOperation(pathItem, method);
			if (!operation) continue;

			// Apply operation filters
			if (operationFilters && !shouldIncludeOperation(operation, path, method, operationFilters)) {
				continue;
			}

			// Generate method name
			const methodName =
				useOperationId && operation.operationId
					? sanitizeOperationId(operation.operationId)
					: generateHttpMethodName(method, path);

			// Extract path parameters
			const pathParams = extractPathParams(path);

			// Merge and extract parameters
			const mergedParams = mergeParameters(pathItem.parameters, operation.parameters, spec);
			const typedParams = mergedParams.filter(isOpenAPIParameterLike);

			// Extract query parameters
			const queryParams: ParameterInfo[] = typedParams
				.filter(p => p.in === "query")
				.map(p => ({
					name: p.name,
					required: p.required ?? false,
					type: schemaToTypeString(p.schema),
					description: p.description,
				}));

			// Extract header parameters (filtered by ignoreHeaders)
			const headerParams: ParameterInfo[] = filterHeaders(
				typedParams.filter(p => p.in === "header"),
				ignoreHeaders
			).map((p: { name: string; required?: boolean; schema?: OpenAPISchemaLike; description?: string }) => ({
				name: p.name,
				required: p.required ?? false,
				type: schemaToTypeString(p.schema),
				description: p.description,
			}));

			// Extract request body info
			let requestBody: RequestBodyInfo | undefined;
			if (operation.requestBody) {
				const resolved = resolveRequestBodyRef(operation.requestBody, spec);
				if (isResolvedRequestBody(resolved) && resolved.content) {
					const contentType = selectContentType(Object.keys(resolved.content), preferredContentTypes);
					if (contentType) {
						const mediaTypeRaw = resolved.content[contentType];
						const mediaType = isMediaTypeContent(mediaTypeRaw) ? mediaTypeRaw : undefined;
						requestBody = {
							required: Boolean(resolved.required),
							contentType,
							typeName: mediaType?.schema ? schemaToTypeString(mediaType.schema) : "unknown",
						};
					}
				}
			}

			// Extract success response type and optionally status code
			let successResponseType: string | undefined;
			let successStatusCode: number | undefined;
			if (operation.responses) {
				for (const [statusCode, responseRef] of Object.entries(operation.responses)) {
					// Only consider 2xx responses
					if (!statusCode.startsWith("2")) continue;

					if (trackStatusCode) {
						successStatusCode = parseInt(statusCode, 10);
					}

					const resolved = resolveResponseRef(responseRef, spec);
					if (isResolvedResponse(resolved) && resolved.content) {
						const contentType = selectContentType(Object.keys(resolved.content), preferredContentTypes);
						if (contentType) {
							const mediaTypeRaw = resolved.content[contentType];
							const mediaType = isMediaTypeContent(mediaTypeRaw) ? mediaTypeRaw : undefined;
							if (mediaType?.schema) {
								successResponseType = schemaToTypeString(mediaType.schema);
								break; // Use first matching success response
							}
						}
					} else if (trackStatusCode) {
						// Response with no content (e.g., 204 No Content)
						successResponseType = "void";
						break;
					}
				}
			}

			endpoints.push({
				path,
				method,
				methodName,
				pathParams,
				queryParams,
				headerParams,
				requestBody,
				successResponseType,
				successStatusCode,
				deprecated: operation.deprecated,
				summary: operation.summary,
				description: operation.description,
			});
		}
	}

	return endpoints;
}

/**
 * Endpoint statistics from an OpenAPI spec
 */
export interface EndpointStats {
	/** Total number of paths in the spec */
	totalPaths: number;
	/** Total number of operations across all paths */
	totalOperations: number;
	/** Number of operations after filtering */
	includedOperations: number;
}

/**
 * Returns statistics about endpoints in an OpenAPI spec
 *
 * @param spec - The OpenAPI specification
 * @param options - Extraction options (filters are applied)
 * @returns Statistics about paths and operations
 *
 * @example
 * ```typescript
 * const stats = getEndpointStats(spec, { operationFilters });
 * console.log(`Including ${stats.includedOperations} of ${stats.totalOperations} operations`);
 * ```
 */
export function getEndpointStats(spec: OpenAPISpec, options: ExtractEndpointsOptions = {}): EndpointStats {
	let totalPaths = 0;
	let totalOperations = 0;

	if (spec.paths) {
		totalPaths = Object.keys(spec.paths).length;

		for (const pathItem of Object.values(spec.paths)) {
			if (!isPathItemLike(pathItem)) continue;
			for (const method of HTTP_METHODS) {
				if (getOperation(pathItem, method)) totalOperations++;
			}
		}
	}

	const endpoints = extractEndpoints(spec, options);

	return {
		totalPaths,
		totalOperations,
		includedOperations: endpoints.length,
	};
}
