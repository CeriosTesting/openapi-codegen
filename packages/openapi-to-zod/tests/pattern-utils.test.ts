import { describe, expect, it } from "vitest";
import { stripPathPrefix, stripPrefix } from "../src/utils/pattern-utils";

describe("stripPrefix", () => {
	describe("literal string matching", () => {
		it("should strip exact string prefix", () => {
			expect(stripPrefix("Company.Models.User", "Company.Models.")).toBe("User");
			expect(stripPrefix("api_v1_UserSchema", "api_v1_")).toBe("UserSchema");
			expect(stripPrefix("Namespace.App.User", "Namespace.App.")).toBe("User");
		});

		it("should return original string when prefix doesn't match", () => {
			expect(stripPrefix("User", "Company.")).toBe("User");
			expect(stripPrefix("api_v2_User", "api_v1_")).toBe("api_v2_User");
		});

		it("should handle empty prefix", () => {
			expect(stripPrefix("User", "")).toBe("User");
			expect(stripPrefix("User", undefined)).toBe("User");
		});

		it("should handle case sensitivity", () => {
			expect(stripPrefix("Company.Models.User", "company.models.")).toBe("Company.Models.User");
			expect(stripPrefix("API_User", "api_")).toBe("API_User");
		});

		it("should not strip partial matches", () => {
			expect(stripPrefix("CompanyUser", "Company")).toBe("User");
			expect(stripPrefix("Company.User", "Company.Models.")).toBe("Company.User");
		});
	});

	describe("regex pattern matching", () => {
		it("should detect and use regex with ^ anchor", () => {
			expect(stripPrefix("api_v1_User", "^api_v\\d+_")).toBe("User");
			expect(stripPrefix("api_v2_Post", "^api_v\\d+_")).toBe("Post");
			expect(stripPrefix("api_v10_Comment", "^api_v\\d+_")).toBe("Comment");
		});

		it("should detect and use regex with character classes", () => {
			expect(stripPrefix("Namespace.User", "^[A-Z][a-z]+\\.")).toBe("User");
			expect(stripPrefix("Company.Post", "^[A-Z][a-z]+\\.")).toBe("Post");
			expect(stripPrefix("App.Comment", "^[A-Z][a-z]+\\.")).toBe("Comment");
		});

		it("should detect and use regex with quantifiers", () => {
			expect(stripPrefix("v1.2.3.User", "^v\\d+\\.\\d+\\.\\d+\\.")).toBe("User");
			expect(stripPrefix("test123User", "^test\\d+")).toBe("User");
			expect(stripPrefix("prefix_User", "^[a-z]+_")).toBe("User");
		});

		it("should use regex with .* wildcard", () => {
			expect(stripPrefix("any.prefix.User", "^.*\\.")).toBe("User");
			expect(stripPrefix("a.b.c.d.User", "^.*\\.d\\.")).toBe("User");
		});

		it("should return original string when regex doesn't match", () => {
			expect(stripPrefix("User", "^api_v\\d+_")).toBe("User");
			expect(stripPrefix("api_User", "^api_v\\d+_")).toBe("api_User");
		});

		it("should handle RegExp objects directly", () => {
			expect(stripPrefix("api_v1_User", /^api_v\d+_/)).toBe("User");
			expect(stripPrefix("Company.User", /^[A-Z][a-z]+\./)).toBe("User");
		});

		it("should handle invalid regex gracefully", () => {
			// Invalid regex should be treated as no match
			expect(stripPrefix("User", "^[invalid")).toBe("User");
		});
	});

	describe("ensureLeadingChar parameter", () => {
		it("should ensure leading character after stripping", () => {
			expect(stripPrefix("api/users", "api", "/")).toBe("/users");
			expect(stripPrefix("api/v1/users", "api", "/")).toBe("/v1/users");
		});

		it("should add leading character if result doesn't have it", () => {
			expect(stripPrefix("prefix_value", "prefix_", "_")).toBe("_value");
			expect(stripPrefix("prefix-value", "prefix-", "-")).toBe("-value");
		});

		it("should return leading character for empty result", () => {
			expect(stripPrefix("api", "api", "/")).toBe("/");
			expect(stripPrefix("prefix_", "prefix_", "_")).toBe("_");
		});

		it("should not add leading character if already present", () => {
			expect(stripPrefix("api/_users", "api/", "/")).toBe("/_users");
			expect(stripPrefix("prefix__value", "prefix_", "_")).toBe("_value");
		});

		it("should work with regex patterns", () => {
			expect(stripPrefix("api_v1_users", "^api_v\\d+_", "_")).toBe("_users");
			expect(stripPrefix("v1.2.users", "^v\\d+\\.\\d+\\.", ".")).toBe(".users");
		});
	});
});

describe("stripPathPrefix", () => {
	describe("literal string matching", () => {
		it("should strip exact path prefix", () => {
			expect(stripPathPrefix("/api/v1/users", "/api/v1")).toBe("/users");
			expect(stripPathPrefix("/api/v2/posts", "/api/v2")).toBe("/posts");
		});

		it("should normalize path prefix (add leading slash)", () => {
			expect(stripPathPrefix("/api/v1/users", "api/v1")).toBe("/users");
			expect(stripPathPrefix("/api/v1/users", "api")).toBe("/v1/users");
		});

		it("should normalize path prefix (remove trailing slash)", () => {
			expect(stripPathPrefix("/api/v1/users", "/api/v1/")).toBe("/users");
			expect(stripPathPrefix("/api/users", "/api/")).toBe("/users");
		});

		it("should handle root path", () => {
			expect(stripPathPrefix("/api", "/api")).toBe("/");
			expect(stripPathPrefix("/", "/")).toBe("/");
		});

		it("should ensure result starts with slash", () => {
			expect(stripPathPrefix("/apiusers", "/api")).toBe("/users");
			expect(stripPathPrefix("/api/users", "/api")).toBe("/users");
		});

		it("should return original path when prefix doesn't match", () => {
			expect(stripPathPrefix("/users", "/api")).toBe("/users");
			expect(stripPathPrefix("/v2/users", "/api/v1")).toBe("/v2/users");
		});

		it("should handle empty or undefined prefix", () => {
			expect(stripPathPrefix("/api/users", "")).toBe("/api/users");
			expect(stripPathPrefix("/api/users", undefined)).toBe("/api/users");
		});
	});

	describe("regex pattern matching", () => {
		it("should detect and use regex with ^ anchor", () => {
			expect(stripPathPrefix("/api/v1/users", "^/api/v\\d+")).toBe("/users");
			expect(stripPathPrefix("/api/v2/posts", "^/api/v\\d+")).toBe("/posts");
			expect(stripPathPrefix("/api/v10/comments", "^/api/v\\d+")).toBe("/comments");
		});

		it("should use regex with version patterns", () => {
			expect(stripPathPrefix("/api/v1.0/users", "^/api/v\\d+\\.\\d+")).toBe("/users");
			expect(stripPathPrefix("/api/v2.1/posts", "^/api/v\\d+\\.\\d+")).toBe("/posts");
		});

		it("should use regex with .* wildcard", () => {
			expect(stripPathPrefix("/any/prefix/users", "^/any/.*?/")).toBe("/users");
		});

		it("should ensure result starts with slash after regex match", () => {
			expect(stripPathPrefix("/api/v1/users", "^/api/v\\d+")).toBe("/users");
			expect(stripPathPrefix("/apiv1users", "^/apiv\\d+")).toBe("/users");
		});

		it("should handle RegExp objects directly", () => {
			expect(stripPathPrefix("/api/v1/users", /^\/api\/v\d+/)).toBe("/users");
			expect(stripPathPrefix("/api/v2.1/posts", /^\/api\/v\d+\.\d+/)).toBe("/posts");
		});

		it("should return original path when regex doesn't match", () => {
			expect(stripPathPrefix("/users", "^/api/v\\d+")).toBe("/users");
			expect(stripPathPrefix("/api/users", "^/api/v\\d+")).toBe("/api/users");
		});

		it("should handle root path with regex", () => {
			expect(stripPathPrefix("/api/v1", "^/api/v\\d+")).toBe("/");
		});
	});

	describe("edge cases", () => {
		it("should handle paths with special characters", () => {
			expect(stripPathPrefix("/api/v1.0/users", "/api/v1.0")).toBe("/users");
			expect(stripPathPrefix("/api-v1/users", "/api-v1")).toBe("/users");
			expect(stripPathPrefix("/api_v1/users", "/api_v1")).toBe("/users");
		});

		it("should handle deeply nested paths", () => {
			expect(stripPathPrefix("/api/v1/internal/admin/users", "/api/v1/internal")).toBe("/admin/users");
			expect(stripPathPrefix("/a/b/c/d/e/f", "/a/b/c")).toBe("/d/e/f");
		});

		it("should handle paths with query parameters (not stripped)", () => {
			expect(stripPathPrefix("/api/v1/users?page=1", "/api/v1")).toBe("/users?page=1");
		});

		it("should handle paths with fragments (not stripped)", () => {
			expect(stripPathPrefix("/api/v1/users#section", "/api/v1")).toBe("/users#section");
		});

		it("should be case sensitive", () => {
			expect(stripPathPrefix("/API/V1/users", "/api/v1")).toBe("/API/V1/users");
			expect(stripPathPrefix("/api/v1/users", "/API/V1")).toBe("/api/v1/users");
		});
	});
});
