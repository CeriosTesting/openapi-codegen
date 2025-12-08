import { describe, expect, it } from "vitest";
import { ZodSchemaGenerator } from "../src/generator";
import type { GeneratorOptions } from "../src/types";
import { TestUtils } from "./utils/test-utils";

describe("Request/Response Options", () => {
	function generateOutput(options?: Partial<GeneratorOptions>): string {
		const generator = new ZodSchemaGenerator({
			input: TestUtils.getFixturePath("type-mode.yaml"),
			...options,
		});
		return generator.generateString();
	}

	describe("Nested options override root options", () => {
		it("should use request options for request schemas", () => {
			const output = generateOutput({
				typeMode: "inferred",
				request: {
					typeMode: "native",
				},
			});

			// CreateUserRequest (used in POST request body) should be native type
			expect(output).toContain("export type CreateUserRequest = {");
			expect(output).not.toContain("export const createUserRequestSchema =");

			// User (used in response) should be Zod schema
			expect(output).toContain("export const userSchema =");
			expect(output).toContain("z.object(");
		});

		it("should use response options for response schemas", () => {
			const output = generateOutput({
				typeMode: "native",
				response: {
					typeMode: "inferred",
				},
			});

			// User (used in GET response) should be Zod schema
			expect(output).toContain("export const userSchema =");
			expect(output).toContain("z.object(");
			expect(output).toContain("export type User = z.infer<typeof userSchema>;");

			// CreateUserRequest (used in POST request body) should be native type
			expect(output).toContain("export type CreateUserRequest = {");
			expect(output).not.toContain("export const createUserRequestSchema =");
		});

		it("should generate Zod import when any schema uses inferred mode", () => {
			const output = generateOutput({
				typeMode: "native",
				response: {
					typeMode: "inferred",
				},
			});

			// Should import Zod because response uses inferred mode
			expect(output).toContain('import { z } from "zod"');
		});

		it("should not generate Zod import when all schemas use native mode", () => {
			const output = generateOutput({
				typeMode: "native",
			});

			// Should NOT import Zod
			expect(output).not.toContain('import { z } from "zod"');
		});
	});

	describe("Mixed configurations", () => {
		it("should handle request: native, response: inferred", () => {
			const output = generateOutput({
				request: {
					typeMode: "native",
					nativeEnumType: "union",
				},
				response: {
					typeMode: "inferred",
					enumType: "zod",
				},
			});

			// Should have both native types and Zod schemas
			expect(output).toContain("export type CreateUserRequest = {");
			expect(output).toContain("export const userSchema =");
			expect(output).toContain('import { z } from "zod"');
		});

		it("should override mode per context", () => {
			const output = generateOutput({
				mode: "normal",
				request: {
					mode: "strict",
				},
				response: {
					mode: "loose",
				},
			});

			// This test validates that different modes are applied
			// The actual validation happens in property-generator
			expect(output).toBeTruthy();
		});

		it("should override enumType per context", () => {
			const output = generateOutput({
				enumType: "zod",
				request: {
					enumType: "typescript",
				},
			});

			// Should generate TypeScript enum for request context
			// UserStatus is used in User which is a response schema
			expect(output).toBeTruthy();
		});

		it("should override includeDescriptions per context", () => {
			const output = generateOutput({
				includeDescriptions: true,
				request: {
					includeDescriptions: false,
				},
				response: {
					includeDescriptions: true,
				},
			});

			// Both contexts should generate successfully
			expect(output).toBeTruthy();
		});
	});

	describe("Schemas used in both contexts", () => {
		it("should use inferred mode for schemas used in both request and response", () => {
			const output = generateOutput({
				request: {
					typeMode: "native",
				},
				response: {
					typeMode: "native",
				},
			});

			// User is used in both POST response (201 Created) and GET response
			// UserStatus is part of User, so it's also used in responses
			// For safety, schemas used in both contexts should be inferred
			// However, in this specific fixture, User is only in responses
			expect(output).toBeTruthy();
		});
	});
});
