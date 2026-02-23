import {
	constructFullPath,
	extractPathParams,
	generateHttpMethodName as generateMethodName,
	generateOperationJSDoc,
	getOperation,
	HTTP_METHODS,
	isPathItemLike,
	normalizeBasePath,
	sanitizeOperationId,
	sanitizeParamName,
	stripPathPrefix,
} from "@cerios/openapi-core";
import type { OpenAPISpec } from "@cerios/openapi-to-zod";

import type { PlaywrightOperationFilters } from "../types";
import { shouldIncludeOperation } from "../utils/operation-filters";

interface EndpointInfo {
	path: string;
	method: string;
	methodName: string;
	pathParams: string[];
	deprecated?: boolean;
	summary?: string;
	description?: string;
}

/**
 * Generates the ApiClient class code
 * The client is a thin passthrough layer with no validation
 * Pure wrapper around Playwright's APIRequestContext with raw options
 * @param spec - OpenAPI specification
 * @param className - Name for the generated client class (default: "ApiClient")
 * @param basePath - Optional base path to prepend to all endpoints
 * @param operationFilters - Optional operation filters to apply
 * @param useOperationId - Whether to use operationId for method names (default: false)
 * @param stripPrefix - Optional path prefix to strip before processing
 * @param warn - Optional warning function for non-fatal issues
 */
export function generateClientClass(
	spec: OpenAPISpec,
	className: string = "ApiClient",
	basePath?: string,
	operationFilters?: PlaywrightOperationFilters,
	useOperationId: boolean = false,
	stripPrefix?: string,
	warn?: (message: string) => void
): string {
	const endpoints = extractEndpoints(spec, operationFilters, useOperationId, stripPrefix);

	// Warn if all operations were filtered out
	if (operationFilters && endpoints.length === 0) {
		// Count total operations
		let totalOperations = 0;
		if (spec.paths) {
			for (const pathItem of Object.values(spec.paths)) {
				if (!isPathItemLike(pathItem)) continue;
				for (const method of HTTP_METHODS) {
					if (getOperation(pathItem, method)) totalOperations++;
				}
			}
		}

		if (totalOperations > 0) {
			warn?.(`All ${totalOperations} operations were filtered out. Check your operationFilters configuration.`);
		}
	}

	if (endpoints.length === 0) {
		return "";
	}

	const normalizedBasePath = normalizeBasePath(basePath);
	const methods = endpoints.map(endpoint => generateClientMethod(endpoint, normalizedBasePath)).join("\n\n");

	return `import type { ApiRequestContextOptions } from "@cerios/openapi-to-zod-playwright";
import { serializeParams } from "@cerios/openapi-to-zod-playwright";

/**
 * Thin passthrough client for API requests
 * Pure wrapper around Playwright's APIRequestContext
 * Exposes path parameters and raw Playwright options
 */
export class ${className} {
	constructor(private readonly request: APIRequestContext) {}

${methods}
}
`;
}

/**
 * Extracts all endpoints from OpenAPI spec
 * @param spec - OpenAPI specification
 * @param operationFilters - Optional operation filters to apply
 * @param useOperationId - Whether to use operationId for method names (default: false)
 * @param stripPrefix - Optional path prefix to strip before processing
 */
function extractEndpoints(
	spec: OpenAPISpec,
	operationFilters?: PlaywrightOperationFilters,
	useOperationId: boolean = false,
	stripPrefix?: string
): EndpointInfo[] {
	const endpoints: EndpointInfo[] = [];

	if (!spec.paths) {
		return endpoints;
	}

	for (const [originalPath, pathItem] of Object.entries(spec.paths)) {
		if (!isPathItemLike(pathItem)) continue;

		// Strip prefix from path for processing
		const path = stripPathPrefix(originalPath, stripPrefix);

		for (const method of HTTP_METHODS) {
			const operation = getOperation(pathItem, method);
			if (!operation) continue;

			// Apply operation filters
			if (!shouldIncludeOperation(operation, path, method, operationFilters)) {
				continue;
			}

			// Use operationId if useOperationId is true and operationId exists, otherwise generate from path
			// Sanitize operationId to ensure it's a valid TypeScript identifier
			const methodName =
				useOperationId && operation.operationId
					? sanitizeOperationId(operation.operationId)
					: generateMethodName(method, path);
			const pathParams = extractPathParams(path);

			endpoints.push({
				path,
				method: method.toUpperCase(),
				methodName,
				pathParams,
				deprecated: operation.deprecated,
				summary: operation.summary,
				description: operation.description,
			});
		}
	}

	return endpoints;
}

/**
 * Generates a single client method - pure passthrough to Playwright
 */
function generateClientMethod(endpoint: EndpointInfo, basePath?: string): string {
	const { path, method, methodName, pathParams } = endpoint;

	// Build parameter list
	const params: string[] = [];

	// Add path parameters as required arguments
	for (const param of pathParams) {
		const sanitized = sanitizeParamName(param);
		params.push(`${sanitized}: string`);
	}

	// Add raw Playwright options parameter
	params.push("options?: ApiRequestContextOptions");

	const paramList = params.join(", ");

	// Construct full path with base path if provided
	const fullPath = constructFullPath(basePath, path);

	// Build URL with path parameter interpolation
	let urlTemplate = fullPath;
	for (const param of pathParams) {
		const sanitized = sanitizeParamName(param);
		urlTemplate = urlTemplate.replace(`{${param}}`, `\${${sanitized}}`);
	}

	// Generate method body - serialize params if present
	const methodLower = method.toLowerCase();

	const jsdoc = generateOperationJSDoc({
		summary: endpoint.summary,
		description: endpoint.description,
		deprecated: endpoint.deprecated,
		method,
		path: fullPath,
		returns: "Raw Playwright APIResponse",
		indent: "\t",
	});

	return `${jsdoc}
	async ${methodName}(${paramList}): Promise<APIResponse> {
		const serializedOptions = options ? { ...options, params: serializeParams(options.params) } : undefined;
		return await this.request.${methodLower}(\`${urlTemplate}\`, serializedOptions);
	}`;
}
