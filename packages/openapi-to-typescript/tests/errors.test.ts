import {
	CliOptionsError,
	ConfigurationError,
	FileOperationError,
	GeneratorError,
	SchemaGenerationError,
	SpecValidationError,
} from "@cerios/openapi-core";
import { describe, expect, it } from "vitest";

describe("Error Classes", () => {
	describe("GeneratorError", () => {
		it("should create an error with message and code", () => {
			const error = new GeneratorError("Test error", "TEST_ERROR");
			expect(error.message).toBe("Test error");
			expect(error.name).toBe("GeneratorError");
			expect(error.code).toBe("TEST_ERROR");
			expect(error).toBeInstanceOf(Error);
		});

		it("should include context when provided", () => {
			const error = new GeneratorError("Test error", "TEST_ERROR", {
				foo: "bar",
			});
			expect(error.context).toEqual({ foo: "bar" });
		});
	});

	describe("ConfigurationError", () => {
		it("should create a configuration error", () => {
			const error = new ConfigurationError("Invalid config");
			expect(error.message).toBe("Invalid config");
			expect(error.name).toBe("ConfigurationError");
			expect(error).toBeInstanceOf(GeneratorError);
		});

		it("should be catchable as GeneratorError", () => {
			const error = new ConfigurationError("Config issue");
			expect(error).toBeInstanceOf(GeneratorError);
			expect(error).toBeInstanceOf(Error);
		});
	});

	describe("FileOperationError", () => {
		it("should create a file operation error", () => {
			const error = new FileOperationError("File not found", "/path/to/file.yaml");
			expect(error.message).toBe("File not found");
			expect(error.name).toBe("FileOperationError");
			expect(error).toBeInstanceOf(GeneratorError);
		});
	});

	describe("SpecValidationError", () => {
		it("should create a spec validation error", () => {
			const error = new SpecValidationError("Invalid schema format");
			expect(error.message).toBe("Invalid schema format");
			expect(error.name).toBe("SpecValidationError");
			expect(error).toBeInstanceOf(GeneratorError);
		});
	});

	describe("SchemaGenerationError", () => {
		it("should create a schema generation error", () => {
			const error = new SchemaGenerationError("Failed to generate", "UserSchema");
			expect(error.message).toBe("Failed to generate");
			expect(error.name).toBe("SchemaGenerationError");
			expect(error.schemaName).toBe("UserSchema");
			expect(error).toBeInstanceOf(GeneratorError);
		});

		it("should include context when provided", () => {
			const context = { originalError: "Original error" };
			const error = new SchemaGenerationError("Failed to generate", "UserSchema", context);
			expect(error.schemaName).toBe("UserSchema");
		});
	});

	describe("CliOptionsError", () => {
		it("should create a CLI options error", () => {
			const error = new CliOptionsError("Invalid option");
			expect(error.message).toBe("Invalid option");
			expect(error.name).toBe("CliOptionsError");
			expect(error).toBeInstanceOf(GeneratorError);
		});

		it("should include context when provided", () => {
			const error = new CliOptionsError("Missing input", { option: "input" });
			expect(error.context).toEqual({ option: "input" });
		});
	});

	describe("Error inheritance chain", () => {
		it("should allow catching all generator errors with base class", () => {
			const errors = [
				new ConfigurationError("config"),
				new SpecValidationError("parsing"),
				new SchemaGenerationError("generation", "TestSchema"),
				new FileOperationError("file", "/path"),
				new CliOptionsError("cli"),
			];

			for (const error of errors) {
				expect(error).toBeInstanceOf(GeneratorError);
				expect(error).toBeInstanceOf(Error);
			}
		});

		it("should preserve stack trace", () => {
			const error = new GeneratorError("Test", "TEST_ERROR");
			expect(error.stack).toBeDefined();
			expect(error.stack).toContain("GeneratorError");
		});
	});
});
