import { describe, expect, it } from "vitest";
import { PlaywrightGenerator } from "../src/playwright-generator";
import { TestUtils } from "./utils/test-utils";

describe("PlaywrightGenerator", () => {
	const fixtureFile = TestUtils.getFixturePath("simple-api.yaml");

	function generateOutput(): string {
		const generator = new PlaywrightGenerator({
			input: fixtureFile,
			output: TestUtils.getOutputPath("simple-api.ts"),
		});
		return generator.generateString();
	}

	it("should generate schemas, client, and service classes", () => {
		const output = generateOutput();

		// Check for Zod schemas
		expect(output).toContain("export const userSchema");
		expect(output).toContain("export const createUserRequestSchema");
		expect(output).toContain("export const errorSchema");

		// Check for Playwright imports
		expect(output).toContain('import type { APIRequestContext, APIResponse } from "@playwright/test"');
		expect(output).toContain('import { expect } from "@playwright/test"');

		// Check for ApiClient class
		expect(output).toContain("export class ApiClient");
		expect(output).toContain("constructor(private readonly request: APIRequestContext)");

		// Check for ApiService class
		expect(output).toContain("export class ApiService");
		expect(output).toContain("constructor(private readonly client: ApiClient)");
	});

	it("should generate client methods with correct names", () => {
		const output = generateOutput();

		// Check client method names
		expect(output).toContain("async getUsers(");
		expect(output).toContain("async postUsers(");
		expect(output).toContain("async getUsersByUserId(userId: string");
		expect(output).toContain("async deleteUsersByUserId(userId: string");
	});

	it("should generate service methods with status codes for multiple responses", () => {
		const output = generateOutput();

		// GET /users has only 200 - no suffix
		expect(output).toContain("async getUsers()");

		// POST /users has only 201 (400 is error) - no suffix for single success response
		expect(output).toContain("async postUsers(options: { data: CreateUserRequest })");

		// GET /users/{userId} has only 200 - no suffix
		expect(output).toContain("async getUsersByUserId(userId: string");

		// DELETE /users/{userId} has only 204 - no suffix
		expect(output).toContain("async deleteUsersByUserId(userId: string");
	});

	it("should generate error methods for endpoints with error responses", () => {
		const output = generateOutput();

		// POST /users has 400 error - should have error method with Partial data
		expect(output).toContain("async postUsersError(options?: { data?: Partial<CreateUserRequest> })");

		// GET /users/{userId} has 404 error - should have error method
		expect(output).toContain("async getUsersByUserIdError(userId: string)");
	});

	it("should use expect for status validation", () => {
		const output = generateOutput();

		// Check for Playwright expect usage
		expect(output).toContain("expect(response.status()).toBe(200)");
		expect(output).toContain("expect(response.status()).toBe(201)");
		expect(output).toContain("expect(response.status()).toBe(204)");
	});

	it("should return null for 204 responses", () => {
		const output = generateOutput();

		// DELETE returns 204 with null
		expect(output).toContain("async deleteUsersByUserId(userId: string): Promise<null>");
		expect(output).toContain("return null;");
	});

	it("should make client data options partial", () => {
		const output = generateOutput();

		// Client methods should have Partial<Type> for data
		expect(output).toContain("async postUsers(options?: { data?: Partial<CreateUserRequest> })");
	});

	describe("String Generation Methods", () => {
		it("should generate schemas as string without writing to file", () => {
			const generator = new PlaywrightGenerator({
				input: fixtureFile,
			});

			const schemasString = generator.generateSchemasString();

			// Should contain Zod schemas
			expect(schemasString).toContain("export const userSchema");
			expect(schemasString).toContain("export const createUserRequestSchema");
			expect(schemasString).toContain('import { z } from "zod"');

			// Should NOT contain client or service classes
			expect(schemasString).not.toContain("export class ApiClient");
			expect(schemasString).not.toContain("export class ApiService");
		});

		it("should generate client class as string", () => {
			const generator = new PlaywrightGenerator({
				input: fixtureFile,
			});

			const clientString = generator.generateClientString();

			// Should contain ApiClient class
			expect(clientString).toContain("export class ApiClient");
			expect(clientString).toContain("constructor(private readonly request: APIRequestContext)");
			expect(clientString).toContain("async getUsers(");

			// Should NOT contain schemas or service class
			expect(clientString).not.toContain("export const userSchema");
			expect(clientString).not.toContain("export class ApiService");
		});

		it("should generate service class as string", () => {
			const generator = new PlaywrightGenerator({
				input: fixtureFile,
			});

			const serviceString = generator.generateServiceString();

			// Should contain ApiService class
			expect(serviceString).toContain("export class ApiService");
			expect(serviceString).toContain("constructor(private readonly client: ApiClient)");

			// Should NOT contain schemas or client class
			expect(serviceString).not.toContain("export const userSchema");
			expect(serviceString).not.toContain("export class ApiClient");
		});

		it("should generate complete output as string", () => {
			const generator = new PlaywrightGenerator({
				input: fixtureFile,
			});

			const completeString = generator.generateString();

			// Should contain everything
			expect(completeString).toContain("export const userSchema");
			expect(completeString).toContain('import { z } from "zod"');
			expect(completeString).toContain('import type { APIRequestContext, APIResponse } from "@playwright/test"');
			expect(completeString).toContain("export class ApiClient");
			expect(completeString).toContain("export class ApiService");
		});

		it("should work without output path when using string methods", () => {
			const generator = new PlaywrightGenerator({
				input: fixtureFile,
			});

			// All string methods should work without output
			const schemas = generator.generateSchemasString();
			const client = generator.generateClientString();
			const service = generator.generateServiceString();
			const complete = generator.generateString();

			expect(schemas).toBeTruthy();
			expect(client).toBeTruthy();
			expect(service).toBeTruthy();
			expect(complete).toBeTruthy();
		});

		it("should throw error when calling generate() without output path", () => {
			const generator = new PlaywrightGenerator({
				input: fixtureFile,
			});

			expect(() => generator.generate()).toThrow(
				"Output path is required when calling generate(). " +
					"Either provide an 'output' option or use generateString() to get the result as a string."
			);
		});
	});
});
