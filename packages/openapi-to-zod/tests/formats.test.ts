import { describe, expect, it } from "vitest";

import { OpenApiGenerator } from "../src/openapi-generator";
import type { OpenApiGeneratorOptions } from "../src/types";
import { buildUuidValidation } from "../src/validators/string-validator";

import { TestUtils } from "./utils/test-utils";

/**
 * Tests for OpenAPI format validation
 * Covers: uuid, email, url, date, date-time, ipv4, ipv6, and format combinations
 */
describe("Format Validation", () => {
	function generateOutput(fixture: string, options?: Partial<OpenApiGeneratorOptions>): string {
		const generator = new OpenApiGenerator({
			input: TestUtils.getFixturePath(fixture),
			outputTypes: "output.ts",
			...options,
		});
		return generator.generateString();
	}

	describe("String Formats", () => {
		it("should handle uuid format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.uuid()");
		});

		it("should handle email format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.email()");
		});

		it("should handle url format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.url()");
		});

		it("should handle date format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.iso.date()");
		});

		it("should handle date-time format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.iso.datetime()");
		});

		it("should handle ipv4 format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.ipv4()");
		});

		it("should handle ipv6 format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.ipv6()");
		});

		it("should handle hostname format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.string().refine((val) => /^(?=.{1,253}$)");
			expect(output).toContain("Must be a valid hostname");
		});

		it("should handle uri-reference format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.string().refine((val) => !/\\s/.test(val)");
			expect(output).toContain("Must be a valid URI reference");
		});

		it("should handle byte format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.base64()");
		});

		it("should handle binary format", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.string()");
		});
	});

	describe("Format Combinations", () => {
		it("should handle string with minLength and maxLength", () => {
			const output = generateOutput("complex.yaml");

			expect(output).toMatch(/z\.string\(\)\.min\(\d+\)\.max\(\d+\)/);
		});

		it("should handle format with optional", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain(".optional()");
		});
	});

	describe("Pattern Validation", () => {
		it("should handle basic regex patterns", () => {
			const output = generateOutput("patterns.yaml");

			expect(output).toContain(".regex(");
		});

		it("should handle pattern with escaped characters", () => {
			const output = generateOutput("patterns.yaml");

			// Should contain regex with escaped backslashes
			expect(output).toMatch(/\.regex\(\/.*\\\\./);
		});

		it("should handle complex regex patterns", () => {
			const output = generateOutput("patterns.yaml");

			// Should contain character classes and quantifiers
			expect(output).toMatch(/\.regex\(\/\^.*\[.*\].*\$\/\)/);
		});

		it("should combine pattern with minLength and maxLength", () => {
			const output = generateOutput("patterns.yaml");

			// Pattern is applied after min/max constraints
			expect(output).toMatch(/\.min\(\d+\)\.max\(\d+\)\.regex\(/);
		});

		it("should handle pattern with format", () => {
			const output = generateOutput("patterns.yaml");

			// When both pattern and format exist, pattern should be applied
			expect(output).toContain(".regex(");
		});

		it("should handle multiple patterns in one schema", () => {
			const output = generateOutput("patterns.yaml");

			// Count regex occurrences for schema with multiple patterned properties
			const regexCount = (output.match(/\.regex\(/g) || []).length;
			expect(regexCount).toBeGreaterThan(0);
		});
	});

	describe("UUID/GUID Format Options", () => {
		it("should default to z.uuid() for format: uuid", () => {
			const output = generateOutput("formats.yaml");

			expect(output).toContain("z.uuid()");
		});

		it("should use z.guid() when uuidFormat is 'guid'", () => {
			const output = generateOutput("formats.yaml", { uuidFormat: "guid" });

			expect(output).toContain("z.guid()");
			expect(output).not.toContain("z.uuid()");
		});

		it("should use z.uuid({ version: \"v4\" }) when uuidFormat is 'uuidv4'", () => {
			const output = generateOutput("formats.yaml", { uuidFormat: "uuidv4" });

			expect(output).toContain('z.uuid({ version: "v4" })');
			expect(output).not.toMatch(/z\.uuid\(\)(?!\.)/);
		});

		it("should use z.uuid({ version: \"v7\" }) when uuidFormat is 'uuidv7'", () => {
			const output = generateOutput("formats.yaml", { uuidFormat: "uuidv7" });

			expect(output).toContain('z.uuid({ version: "v7" })');
		});

		it("should recognize format: guid in OpenAPI spec", () => {
			const output = generateOutput("formats.yaml");

			// With default uuidFormat, guid should map to z.uuid()
			expect(output).toContain("guidId: z.uuid()");
		});

		it("should apply uuidFormat to format: guid fields", () => {
			const output = generateOutput("formats.yaml", { uuidFormat: "guid" });

			// Both uuid and guid format fields should use z.guid()
			expect(output).toContain("guidId: z.guid()");
			expect(output).toContain("id: z.guid()");
		});

		it("should apply versioned uuidFormat to both uuid and guid fields", () => {
			const output = generateOutput("formats.yaml", { uuidFormat: "uuidv1" });

			expect(output).toContain('id: z.uuid({ version: "v1" })');
			expect(output).toContain('guidId: z.uuid({ version: "v1" })');
		});
	});

	describe("buildUuidValidation", () => {
		it("should return z.uuid() by default", () => {
			expect(buildUuidValidation()).toBe("z.uuid()");
		});

		it("should return z.uuid() for 'uuid'", () => {
			expect(buildUuidValidation("uuid")).toBe("z.uuid()");
		});

		it("should return z.guid() for 'guid'", () => {
			expect(buildUuidValidation("guid")).toBe("z.guid()");
		});

		it.each([
			["uuidv1", "v1"],
			["uuidv2", "v2"],
			["uuidv3", "v3"],
			["uuidv4", "v4"],
			["uuidv5", "v5"],
			["uuidv6", "v6"],
			["uuidv7", "v7"],
			["uuidv8", "v8"],
		] as const)("should return z.uuid({ version: \"%s\" }) for '%s'", (format, version) => {
			expect(buildUuidValidation(format)).toBe(`z.uuid({ version: "${version}" })`);
		});

		it("should return z.uuid() for undefined", () => {
			expect(buildUuidValidation(undefined)).toBe("z.uuid()");
		});
	});
});
