import { describe, expect, it } from "vitest";
import { ZodSchemaGenerator } from "../src/generator";
import type { GeneratorOptions } from "../src/types";
import { TestUtils } from "./utils/test-utils";

describe("Type Mode Generation", () => {
	function generateOutput(options?: Partial<GeneratorOptions>): string {
		const generator = new ZodSchemaGenerator({
			input: TestUtils.getFixturePath("type-mode.yaml"),
			...options,
		});
		return generator.generateString();
	}

	describe("typeMode: inferred (default)", () => {
		it("should generate Zod schemas with z.infer types by default", () => {
			const output = generateOutput();

			// Should import Zod
			expect(output).toContain('import { z } from "zod"');

			// Should generate Zod schemas
			expect(output).toContain("export const userSchema = ");
			expect(output).toMatch(/z\.object\(/);

			// Should generate z.infer types
			expect(output).toContain("export type User = z.infer<typeof userSchema>;");
			expect(output).toContain("export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;");

			// Should generate Zod enum
			expect(output).toContain("export const userStatusSchema = z.enum");
			expect(output).toContain("export type UserStatus = z.infer<typeof userStatusSchema>;");
		});

		it("should apply constraints with Zod validators", () => {
			const output = generateOutput({ typeMode: "inferred" });

			// String constraints
			expect(output).toMatch(/\.min\(1\)/);
			expect(output).toMatch(/\.max\(100\)/);
			expect(output).toMatch(/\.email\(\)/);

			// Number constraints
			expect(output).toMatch(/\.gte\(0\)/);
			expect(output).toMatch(/\.lte\(150\)/);

			// Array constraints
			expect(output).toMatch(/\.array\(/);
		});
	});

	describe("typeMode: native", () => {
		it("should generate native TypeScript types without Zod", () => {
			const output = generateOutput({ typeMode: "native" });

			// Should NOT import Zod
			expect(output).not.toContain('import { z } from "zod"');

			// Should generate TypeScript types
			expect(output).toContain("export type User = {");
			expect(output).toContain("export type CreateUserRequest = {");

			// Should NOT generate Zod schemas
			expect(output).not.toContain("export const userSchema = ");
			expect(output).not.toContain("z.object(");
			expect(output).not.toContain("z.infer");
		});

		it("should generate union types for enums by default", () => {
			const output = generateOutput({ typeMode: "native", nativeEnumType: "union" });

			// Should generate union type
			expect(output).toContain('export type UserStatus = "active" | "inactive" | "suspended";');

			// Should NOT generate TypeScript enum
			expect(output).not.toContain("enum UserStatusEnum");
		});

		it("should generate TypeScript enums when nativeEnumType is enum", () => {
			const output = generateOutput({ typeMode: "native", nativeEnumType: "enum" });

			// Should generate TypeScript enum with Enum suffix
			expect(output).toContain("export enum UserStatusEnum {");
			expect(output).toMatch(/Active = "active"/);
			expect(output).toMatch(/Inactive = "inactive"/);
			expect(output).toMatch(/Suspended = "suspended"/);

			// Should generate type alias
			expect(output).toContain("export type UserStatus = UserStatusEnum;");
		});

		it("should add constraint JSDoc when includeDescriptions is true", () => {
			const output = generateOutput({ typeMode: "native", includeDescriptions: true });

			// Should include constraint annotations in JSDoc
			expect(output).toMatch(/@minLength 1/);
			expect(output).toMatch(/@maxLength 100/);
			expect(output).toMatch(/@pattern/);
			expect(output).toMatch(/@minimum 0/);
			expect(output).toMatch(/@maximum 150/);
			expect(output).toMatch(/@format email/);
		});

		it("should not add constraint JSDoc when includeDescriptions is false", () => {
			const output = generateOutput({ typeMode: "native", includeDescriptions: false });

			// Should NOT include constraint annotations
			expect(output).not.toMatch(/@minLength/);
			expect(output).not.toMatch(/@maxLength/);
			expect(output).not.toMatch(/@minimum/);
			expect(output).not.toMatch(/@maximum/);
		});

		it("should handle nested objects and arrays", () => {
			const output = generateOutput({ typeMode: "native" });

			// Should reference nested type
			expect(output).toContain("profile?: UserProfile;");

			// Should generate nested type
			expect(output).toContain("export type UserProfile = {");

			// Should handle arrays
			expect(output).toContain("tags?: string[];");
		});
	});
});
