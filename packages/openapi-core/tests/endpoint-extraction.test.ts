import { describe, expect, it } from "vitest";

import type { OpenAPISpec } from "../src/types";
import { extractEndpoints, getEndpointStats } from "../src/utils/endpoint-extraction";
import { generateOperationJSDoc, generateMinimalJSDoc } from "../src/utils/jsdoc-utils";
import { deriveClassName } from "../src/utils/name-utils";
import {
	schemaToTypeString,
	isResolvedRequestBody,
	isResolvedResponse,
	isMediaTypeContent,
} from "../src/utils/schema-utils";

describe("deriveClassName", () => {
	it("should extract class name from file path", () => {
		expect(deriveClassName("src/api-client.ts")).toBe("ApiClient");
		expect(deriveClassName("src/user-service.ts")).toBe("UserService");
	});

	it("should handle Windows paths", () => {
		expect(deriveClassName("src\\api-client.ts")).toBe("ApiClient");
	});

	it("should add suffix correctly", () => {
		expect(deriveClassName("src/api.ts", "Client")).toBe("ApiClient");
		expect(deriveClassName("src/user-api.ts", "Service")).toBe("UserApiService");
	});

	it("should avoid duplicating suffix", () => {
		expect(deriveClassName("src/api-client.ts", "Client")).toBe("ApiClient");
		expect(deriveClassName("src/user-service.ts", "Service")).toBe("UserService");
	});

	it("should handle underscore-separated names", () => {
		expect(deriveClassName("src/api_client.ts")).toBe("ApiClient");
	});
});

describe("schemaToTypeString", () => {
	it("should return 'unknown' for undefined schema", () => {
		expect(schemaToTypeString(undefined)).toBe("unknown");
	});

	it("should handle $ref schemas", () => {
		expect(schemaToTypeString({ $ref: "#/components/schemas/User" })).toBe("User");
		expect(schemaToTypeString({ $ref: "#/components/schemas/nested/DeepType" })).toBe("DeepType");
	});

	it("should handle primitive types", () => {
		expect(schemaToTypeString({ type: "string" })).toBe("string");
		expect(schemaToTypeString({ type: "number" })).toBe("number");
		expect(schemaToTypeString({ type: "integer" })).toBe("number");
		expect(schemaToTypeString({ type: "boolean" })).toBe("boolean");
	});

	it("should handle string enums", () => {
		expect(schemaToTypeString({ type: "string", enum: ["a", "b", "c"] })).toBe('"a" | "b" | "c"');
	});

	it("should handle array types", () => {
		expect(schemaToTypeString({ type: "array", items: { type: "string" } })).toBe("string[]");
		expect(schemaToTypeString({ type: "array", items: { $ref: "#/components/schemas/User" } })).toBe("User[]");
	});

	it("should handle object types", () => {
		expect(schemaToTypeString({ type: "object" })).toBe("Record<string, unknown>");
		expect(
			schemaToTypeString({
				type: "object",
				additionalProperties: { type: "string" },
			})
		).toBe("Record<string, string>");
	});

	it("should handle null and undefined types", () => {
		expect(schemaToTypeString({ type: "null" })).toBe("unknown");
		expect(schemaToTypeString({ type: undefined })).toBe("unknown");
	});
});

describe("isResolvedRequestBody", () => {
	it("should return true for valid request bodies", () => {
		expect(isResolvedRequestBody({ content: {} })).toBe(true);
		expect(isResolvedRequestBody({ content: {}, required: true })).toBe(true);
	});

	it("should return false for invalid values", () => {
		expect(isResolvedRequestBody(null)).toBe(false);
		expect(isResolvedRequestBody(undefined)).toBe(false);
		expect(isResolvedRequestBody({})).toBe(false);
		expect(isResolvedRequestBody({ required: true })).toBe(false);
	});
});

describe("isResolvedResponse", () => {
	it("should return true for valid responses", () => {
		expect(isResolvedResponse({ content: {} })).toBe(true);
	});

	it("should return false for invalid values", () => {
		expect(isResolvedResponse(null)).toBe(false);
		expect(isResolvedResponse(undefined)).toBe(false);
		expect(isResolvedResponse({})).toBe(false);
	});
});

describe("isMediaTypeContent", () => {
	it("should return true for valid media type content", () => {
		expect(isMediaTypeContent({})).toBe(true);
		expect(isMediaTypeContent({ schema: { type: "string" } })).toBe(true);
	});

	it("should return false for null and undefined", () => {
		expect(isMediaTypeContent(null)).toBe(false);
		expect(isMediaTypeContent(undefined)).toBe(false);
	});
});

describe("generateOperationJSDoc", () => {
	it("should generate basic JSDoc", () => {
		const jsdoc = generateOperationJSDoc({
			method: "GET",
			path: "/users",
		});
		expect(jsdoc).toContain("/**");
		expect(jsdoc).toContain("@method GET /users");
		expect(jsdoc).toContain("*/");
	});

	it("should include summary when provided", () => {
		const jsdoc = generateOperationJSDoc({
			method: "GET",
			path: "/users",
			summary: "Get all users",
		});
		expect(jsdoc).toContain("@summary Get all users");
	});

	it("should include description when provided", () => {
		const jsdoc = generateOperationJSDoc({
			method: "POST",
			path: "/users",
			description: "Creates a new user",
		});
		expect(jsdoc).toContain("@description Creates a new user");
	});

	it("should include deprecated tag", () => {
		const jsdoc = generateOperationJSDoc({
			method: "DELETE",
			path: "/users/{id}",
			deprecated: true,
		});
		expect(jsdoc).toContain("@deprecated");
	});

	it("should include returns annotation", () => {
		const jsdoc = generateOperationJSDoc({
			method: "GET",
			path: "/users",
			returns: "User[]",
		});
		expect(jsdoc).toContain("@returns User[]");
	});

	it("should respect includeDescriptions option", () => {
		const jsdoc = generateOperationJSDoc({
			method: "GET",
			path: "/users",
			summary: "Get users",
			description: "Returns all users",
			includeDescriptions: false,
		});
		expect(jsdoc).not.toContain("@summary");
		expect(jsdoc).not.toContain("@description");
		expect(jsdoc).toContain("@method GET /users");
	});
});

describe("generateMinimalJSDoc", () => {
	it("should generate minimal JSDoc without @tags", () => {
		const jsdoc = generateMinimalJSDoc({
			method: "GET",
			path: "/users",
			summary: "Get users",
		});
		expect(jsdoc).toContain("/**");
		expect(jsdoc).toContain("Get users");
		expect(jsdoc).toContain("GET /users");
		expect(jsdoc).not.toContain("@summary");
	});

	it("should include deprecated tag", () => {
		const jsdoc = generateMinimalJSDoc({
			method: "GET",
			path: "/users",
			deprecated: true,
		});
		expect(jsdoc).toContain("@deprecated");
	});
});

describe("extractEndpoints", () => {
	const simpleSpec: OpenAPISpec = {
		openapi: "3.0.0",
		info: { title: "Test API", version: "1.0.0" },
		paths: {
			"/users": {
				get: {
					operationId: "getUsers",
					summary: "Get all users",
					responses: {
						"200": {
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/User" },
								},
							},
						},
					},
				},
				post: {
					operationId: "createUser",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/CreateUserInput" },
							},
						},
					},
					responses: {
						"201": {
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/User" },
								},
							},
						},
					},
				},
			},
			"/users/{id}": {
				get: {
					operationId: "getUserById",
					deprecated: true,
					parameters: [{ name: "id", in: "path", required: true }],
					responses: {
						"200": {
							content: {
								"application/json": {
									schema: { $ref: "#/components/schemas/User" },
								},
							},
						},
					},
				},
			},
		},
	};

	it("should extract endpoints from OpenAPI spec", () => {
		const endpoints = extractEndpoints(simpleSpec);
		expect(endpoints).toHaveLength(3);
	});

	it("should use operationId when enabled", () => {
		const endpoints = extractEndpoints(simpleSpec, { useOperationId: true });
		const methodNames = endpoints.map(e => e.methodName);
		expect(methodNames).toContain("getUsers");
		expect(methodNames).toContain("createUser");
		expect(methodNames).toContain("getUserById");
	});

	it("should generate method names from path when operationId disabled", () => {
		const endpoints = extractEndpoints(simpleSpec, { useOperationId: false });
		const methodNames = endpoints.map(e => e.methodName);
		expect(methodNames).toContain("getUsers");
		expect(methodNames).toContain("postUsers");
		expect(methodNames).toContain("getUsersById");
	});

	it("should extract path parameters", () => {
		const endpoints = extractEndpoints(simpleSpec);
		const getUserById = endpoints.find(e => e.path === "/users/{id}");
		expect(getUserById?.pathParams).toContain("id");
	});

	it("should extract request body info", () => {
		const endpoints = extractEndpoints(simpleSpec, { useOperationId: true });
		const createUser = endpoints.find(e => e.methodName === "createUser");
		expect(createUser?.requestBody).toBeDefined();
		expect(createUser?.requestBody?.required).toBe(true);
		expect(createUser?.requestBody?.contentType).toBe("application/json");
	});

	it("should extract success response type", () => {
		const endpoints = extractEndpoints(simpleSpec, { useOperationId: true });
		const getUsers = endpoints.find(e => e.methodName === "getUsers");
		expect(getUsers?.successResponseType).toBe("User");
	});

	it("should track deprecated status", () => {
		const endpoints = extractEndpoints(simpleSpec, { useOperationId: true });
		const getUserById = endpoints.find(e => e.methodName === "getUserById");
		expect(getUserById?.deprecated).toBe(true);
	});

	it("should apply path prefix stripping", () => {
		const specWithPrefix: OpenAPISpec = {
			...simpleSpec,
			paths: {
				"/api/v1/users": {
					get: { responses: {} },
				},
			},
		};
		const endpoints = extractEndpoints(specWithPrefix, { stripPathPrefix: "/api/v1" });
		expect(endpoints[0].path).toBe("/users");
	});
});

describe("getEndpointStats", () => {
	const simpleSpec: OpenAPISpec = {
		openapi: "3.0.0",
		info: { title: "Test API", version: "1.0.0" },
		paths: {
			"/users": {
				get: { responses: {} },
				post: { responses: {} },
			},
			"/users/{id}": {
				get: { responses: {} },
			},
		},
	};

	it("should return correct statistics", () => {
		const stats = getEndpointStats(simpleSpec);
		expect(stats.totalPaths).toBe(2);
		expect(stats.totalOperations).toBe(3);
		expect(stats.includedOperations).toBe(3);
	});

	it("should reflect filtered operations", () => {
		const stats = getEndpointStats(simpleSpec, {
			operationFilters: {
				includeMethods: ["get"],
			},
		});
		expect(stats.totalOperations).toBe(3);
		expect(stats.includedOperations).toBe(2);
	});
});
