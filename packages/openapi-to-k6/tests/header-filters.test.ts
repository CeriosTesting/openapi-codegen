import { filterHeaders, shouldIgnoreHeader } from "@cerios/openapi-core";
import { describe, expect, it } from "vitest";

describe("header-filters utilities", () => {
	describe("shouldIgnoreHeader", () => {
		it("should not ignore any headers when no patterns specified", () => {
			expect(shouldIgnoreHeader("Authorization")).toBe(false);
			expect(shouldIgnoreHeader("X-API-Key")).toBe(false);
		});

		it("should not ignore any headers when patterns is empty array", () => {
			expect(shouldIgnoreHeader("Authorization", [])).toBe(false);
		});

		it("should ignore all headers with wildcard pattern", () => {
			expect(shouldIgnoreHeader("Authorization", ["*"])).toBe(true);
			expect(shouldIgnoreHeader("X-Custom", ["*"])).toBe(true);
		});

		it("should match exact header names (case-insensitive)", () => {
			expect(shouldIgnoreHeader("Authorization", ["authorization"])).toBe(true);
			expect(shouldIgnoreHeader("authorization", ["Authorization"])).toBe(true);
			expect(shouldIgnoreHeader("X-API-Key", ["x-api-key"])).toBe(true);
		});

		it("should match glob patterns", () => {
			expect(shouldIgnoreHeader("X-Custom-Header", ["x-*"])).toBe(true);
			expect(shouldIgnoreHeader("X-Request-ID", ["x-*"])).toBe(true);
			expect(shouldIgnoreHeader("Authorization", ["x-*"])).toBe(false);
		});

		it("should match multiple patterns", () => {
			const patterns = ["authorization", "x-*"];

			expect(shouldIgnoreHeader("Authorization", patterns)).toBe(true);
			expect(shouldIgnoreHeader("X-Custom", patterns)).toBe(true);
			expect(shouldIgnoreHeader("Content-Type", patterns)).toBe(false);
		});
	});

	describe("filterHeaders", () => {
		const headers = [
			{ name: "Authorization", required: false },
			{ name: "X-API-Key", required: true },
			{ name: "X-Request-ID", required: false },
			{ name: "Content-Type", required: true },
		];

		it("should return all headers when no patterns specified", () => {
			const result = filterHeaders(headers);
			expect(result).toHaveLength(4);
		});

		it("should filter headers matching patterns", () => {
			const result = filterHeaders(headers, ["x-*"]);
			expect(result).toHaveLength(2);
			expect(result.map(h => h.name)).toEqual(["Authorization", "Content-Type"]);
		});

		it("should filter multiple patterns", () => {
			const result = filterHeaders(headers, ["authorization", "x-*"]);
			expect(result).toHaveLength(1);
			expect(result[0].name).toBe("Content-Type");
		});

		it("should return empty array when all headers filtered", () => {
			const result = filterHeaders(headers, ["*"]);
			expect(result).toHaveLength(0);
		});
	});
});
