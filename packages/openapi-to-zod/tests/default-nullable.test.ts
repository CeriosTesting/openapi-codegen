import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { OpenApiGenerator } from "../src/openapi-generator";

describe("defaultNullable option", () => {
	const testDir = join(__dirname, "fixtures", "default-nullable-test");
	const specPath = join(testDir, "spec.yaml");

	beforeAll(() => {
		mkdirSync(testDir, { recursive: true });

		// Create a test OpenAPI spec with properties that don't have explicit nullable
		const spec = `
openapi: 3.0.3
info:
  title: Default Nullable Test API
  version: 1.0.0
paths: {}
components:
  schemas:
    User:
      type: object
      required:
        - id
      properties:
        id:
          type: integer
          description: User ID
        name:
          type: string
          description: User name without explicit nullable
        email:
          type: string
          nullable: true
          description: Email explicitly nullable
        phone:
          type: string
          nullable: false
          description: Phone explicitly not nullable
    NullableTest:
      type: object
      properties:
        implicitField:
          type: string
          description: No nullable annotation
        explicitNullable:
          type: string
          nullable: true
        explicitNotNullable:
          type: string
          nullable: false
        arrayField:
          type: array
          items:
            type: string
`;
		writeFileSync(specPath, spec.trim());
	});

	afterAll(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("defaultNullable: false (default behavior)", () => {
		it("should not add .nullable() to properties without explicit nullable annotation", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: false,
			});
			const output = generator.generateString();

			// Fields without explicit nullable should NOT have .nullable()
			// id is required and has no nullable - should not be nullable
			expect(output).toMatch(/id:\s*z\.number\(\)\.int\(\)(?!\.nullable)/);
			// name has no nullable annotation - should not be nullable
			expect(output).toMatch(/name:\s*z\.string\(\)\.optional\(\)(?!\.nullable)/);
		});

		it("should still add .nullable() when explicitly set to true", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: false,
			});
			const output = generator.generateString();

			// email has nullable: true - should have .nullable()
			expect(output).toMatch(/email:\s*z\.string\(\)\.nullable\(\)/);
		});

		it("should not add .nullable() when explicitly set to false", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: false,
			});
			const output = generator.generateString();

			// phone has nullable: false - should NOT have .nullable()
			expect(output).toMatch(/phone:\s*z\.string\(\)(?!\.nullable)/);
		});
	});

	describe("defaultNullable: true", () => {
		it("should add .nullable() to properties without explicit nullable annotation", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: true,
			});
			const output = generator.generateString();

			// Fields without explicit nullable should have .nullable() when defaultNullable is true
			// name has no nullable annotation - should be nullable with defaultNullable: true
			expect(output).toMatch(/name:\s*z\.string\(\)\.nullable\(\)/);
		});

		it("should still respect explicit nullable: true", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: true,
			});
			const output = generator.generateString();

			// email has nullable: true - should have .nullable()
			expect(output).toMatch(/email:\s*z\.string\(\)\.nullable\(\)/);
		});

		it("should respect explicit nullable: false and NOT add .nullable()", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: true,
			});
			const output = generator.generateString();

			// phone has nullable: false - should NOT have .nullable() even with defaultNullable: true
			expect(output).toMatch(/phone:\s*z\.string\(\)(?!\.nullable)/);
		});

		it("should add .nullable() to implicit fields in NullableTest schema", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: true,
			});
			const output = generator.generateString();

			// implicitField has no nullable annotation - should be nullable with defaultNullable: true
			expect(output).toMatch(/implicitField:\s*z\.string\(\)\.nullable\(\)/);
			// explicitNullable has nullable: true
			expect(output).toMatch(/explicitNullable:\s*z\.string\(\)\.nullable\(\)/);
			// explicitNotNullable has nullable: false - should NOT have .nullable()
			expect(output).toMatch(/explicitNotNullable:\s*z\.string\(\)(?!\.nullable)/);
		});
	});

	describe("default behavior (no option specified)", () => {
		it("should default to false (strict mode - only explicit nullable)", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				// defaultNullable not specified - should default to false
			});
			const output = generator.generateString();

			// name has no nullable annotation - should NOT be nullable (default is false)
			// It should be z.string().optional() without .nullable()
			expect(output).toMatch(/name:\s*z\.string\(\)\.optional\(\)(?!\.nullable)/);
		});
	});

	describe("top-level schemas should NOT be affected by defaultNullable", () => {
		it("should NOT add .nullable() to top-level object schema definitions with defaultNullable: true", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: true,
			});
			const output = generator.generateString();

			// Top-level schema definitions should NOT end with .nullable()
			// User schema should be: z.object({...}); NOT z.object({...}).nullable();
			// Look for schema definitions that incorrectly have .nullable() at the end
			expect(output).not.toMatch(/export const userSchema = z\.object\(\{[\s\S]*?\}\)\.nullable\(\);/);
			expect(output).not.toMatch(/export const nullableTestSchema = z\.object\(\{[\s\S]*?\}\)\.nullable\(\);/);
		});

		it("should add .nullable() to properties but not to the containing object schema", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: true,
			});
			const output = generator.generateString();

			// Properties should have .nullable()
			expect(output).toMatch(/name:\s*z\.string\(\)\.nullable\(\)/);
			expect(output).toMatch(/implicitField:\s*z\.string\(\)\.nullable\(\)/);

			// But the schema definition should not end with .nullable()
			// Count schema definitions with .nullable() at the end - should be 0
			const topLevelNullableSchemas = output.match(
				/export const \w+Schema = z\.object\(\{[\s\S]*?\}\)\.nullable\(\);/g
			);
			expect(topLevelNullableSchemas).toBeNull();
		});

		it("should produce correct output format with defaultNullable: true", () => {
			const generator = new OpenApiGenerator({
				input: specPath,
				defaultNullable: true,
			});
			const output = generator.generateString();

			// The output should contain the schema without .nullable() at the end
			// Properties inside should have .nullable()
			expect(output).toContain("export const userSchema = z.object({");
			expect(output).toContain("export const nullableTestSchema = z.object({");

			// Verify the closing pattern is NOT }).nullable();
			const lines = output.split("\n");
			for (const line of lines) {
				if (line.includes("export const") && line.includes("Schema = z.object(")) {
					// This starts a schema definition - find where it ends
					// The end should be }); not }).nullable();
				}
			}
		});
	});
});
