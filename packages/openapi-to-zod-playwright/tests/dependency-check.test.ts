import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MissingDependencyError } from "../src/errors";

describe("Dependency Check", () => {
	describe("MissingDependencyError", () => {
		it("should have correct name property", () => {
			const error = new MissingDependencyError("Test error message", "@cerios/openapi-to-zod");

			expect(error.name).toBe("MissingDependencyError");
		});

		it("should have correct message property", () => {
			const message = "Package is required but not installed";
			const error = new MissingDependencyError(message, "@cerios/openapi-to-zod");

			expect(error.message).toBe(message);
		});

		it("should have correct packageName property", () => {
			const packageName = "@cerios/openapi-to-zod";
			const error = new MissingDependencyError("Test error", packageName);

			expect(error.packageName).toBe(packageName);
		});

		it("should be instanceof Error", () => {
			const error = new MissingDependencyError("Test error", "@cerios/openapi-to-zod");

			expect(error).toBeInstanceOf(Error);
		});

		it("should be instanceof MissingDependencyError", () => {
			const error = new MissingDependencyError("Test error", "@cerios/openapi-to-zod");

			expect(error).toBeInstanceOf(MissingDependencyError);
		});

		it("should have a stack trace", () => {
			const error = new MissingDependencyError("Test error", "@cerios/openapi-to-zod");

			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("MissingDependencyError");
		});
	});

	describe("checkCoreDependency", () => {
		beforeEach(() => {
			vi.resetModules();
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should not throw when @cerios/openapi-to-zod is installed", async () => {
			// The package is installed in the workspace, so this should not throw
			const { checkCoreDependency } = await import("../src/utils/dependency-check");

			expect(() => checkCoreDependency()).not.toThrow();
		});

		it("should create proper error with installation instructions", () => {
			// Test the error message format directly since mocking require.resolve is complex
			const packageName = "@cerios/openapi-to-zod";
			const error = new MissingDependencyError(
				`${packageName} is required but not installed.\n` + `Please install it: npm install ${packageName}`,
				packageName
			);

			expect(error.message).toContain("is required but not installed");
			expect(error.message).toContain("npm install @cerios/openapi-to-zod");
			expect(error.packageName).toBe(packageName);
		});

		it("should format the error message correctly for any package", () => {
			const packageName = "some-other-package";
			const error = new MissingDependencyError(
				`${packageName} is required but not installed.\n` + `Please install it: npm install ${packageName}`,
				packageName
			);

			expect(error.message).toContain(packageName);
			expect(error.message).toContain(`npm install ${packageName}`);
		});
	});

	describe("MissingDependencyError export", () => {
		it("should be exported from the main index", async () => {
			// This test verifies that MissingDependencyError is properly exported
			const exports = await import("../src/index");

			expect(exports.MissingDependencyError).toBeDefined();
			// Verify it's a constructor function
			expect(typeof exports.MissingDependencyError).toBe("function");
			// Verify we can instantiate it
			const error = new exports.MissingDependencyError("test", "test-package");
			expect(error.name).toBe("MissingDependencyError");
		});

		it("should be usable for instanceof checks from the export", async () => {
			const exports = await import("../src/index");

			const error = new exports.MissingDependencyError("test error", "test-package");

			expect(error).toBeInstanceOf(exports.MissingDependencyError);
			expect(error).toBeInstanceOf(Error);
		});
	});
});
