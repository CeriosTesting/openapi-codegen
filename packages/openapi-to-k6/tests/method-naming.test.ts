import {
	extractPathParams,
	generateHttpMethodName as generateMethodName,
	pathToPascalCase,
	sanitizeOperationId,
	sanitizeParamName,
} from "@cerios/openapi-core";
import { describe, expect, it } from "vitest";

describe("method-naming utilities", () => {
	describe("pathToPascalCase", () => {
		it("should convert simple path to PascalCase", () => {
			expect(pathToPascalCase("/users")).toBe("Users");
			expect(pathToPascalCase("/auth/login")).toBe("AuthLogin");
		});

		it("should handle path parameters", () => {
			expect(pathToPascalCase("/users/{userId}")).toBe("UsersByUserId");
			expect(pathToPascalCase("/orgs/{orgId}/members/{memberId}")).toBe("OrgsByOrgIdMembersByMemberId");
		});

		it("should handle root path", () => {
			expect(pathToPascalCase("/")).toBe("Root");
			expect(pathToPascalCase("")).toBe("Root");
		});
	});

	describe("generateMethodName", () => {
		it("should generate method name from HTTP method and path", () => {
			expect(generateMethodName("get", "/users")).toBe("getUsers");
			expect(generateMethodName("post", "/users")).toBe("postUsers");
			expect(generateMethodName("GET", "/users")).toBe("getUsers");
		});

		it("should handle path parameters", () => {
			expect(generateMethodName("get", "/users/{userId}")).toBe("getUsersByUserId");
			expect(generateMethodName("delete", "/users/{userId}")).toBe("deleteUsersByUserId");
		});
	});

	describe("extractPathParams", () => {
		it("should extract path parameters", () => {
			expect(extractPathParams("/users/{userId}")).toEqual(["userId"]);
			expect(extractPathParams("/orgs/{orgId}/members/{memberId}")).toEqual(["orgId", "memberId"]);
		});

		it("should return empty array for paths without parameters", () => {
			expect(extractPathParams("/users")).toEqual([]);
			expect(extractPathParams("/auth/login")).toEqual([]);
		});
	});

	describe("sanitizeParamName", () => {
		it("should convert kebab-case to camelCase", () => {
			expect(sanitizeParamName("user-id")).toBe("userId");
			expect(sanitizeParamName("org-member-id")).toBe("orgMemberId");
		});

		it("should convert snake_case to camelCase", () => {
			expect(sanitizeParamName("user_id")).toBe("userId");
			expect(sanitizeParamName("org_member_id")).toBe("orgMemberId");
		});

		it("should prefix with underscore if starts with number", () => {
			expect(sanitizeParamName("123id")).toBe("_123id");
		});

		it("should preserve valid identifiers", () => {
			expect(sanitizeParamName("userId")).toBe("userId");
			expect(sanitizeParamName("id")).toBe("id");
		});
	});

	describe("sanitizeOperationId", () => {
		it("should convert kebab-case to camelCase", () => {
			expect(sanitizeOperationId("get-users")).toBe("getUsers");
			expect(sanitizeOperationId("create-new-user")).toBe("createNewUser");
		});

		it("should convert snake_case to camelCase", () => {
			expect(sanitizeOperationId("get_users")).toBe("getUsers");
		});

		it("should convert PascalCase to camelCase", () => {
			expect(sanitizeOperationId("GetUsers")).toBe("getUsers");
			expect(sanitizeOperationId("CreateUser")).toBe("createUser");
		});

		it("should preserve camelCase", () => {
			expect(sanitizeOperationId("getUsers")).toBe("getUsers");
			expect(sanitizeOperationId("createUser")).toBe("createUser");
		});

		it("should handle mixed formats", () => {
			expect(sanitizeOperationId("Get-User_ById")).toBe("getUserByid");
		});

		it("should prefix with underscore if starts with number", () => {
			expect(sanitizeOperationId("123operation")).toBe("_123operation");
		});

		it("should return 'operation' for empty/invalid input", () => {
			expect(sanitizeOperationId("---")).toBe("operation");
		});
	});
});
