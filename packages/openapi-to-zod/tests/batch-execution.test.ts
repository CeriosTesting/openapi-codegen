import { existsSync, unlinkSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { executeBatch, getBatchExitCode } from "../src/batch-executor";
import type { SpecConfig } from "../src/types";

describe("Batch Execution", () => {
	const outputFiles = [
		"tests/output/batch-parallel-simple.ts",
		"tests/output/batch-parallel-composition.ts",
		"tests/output/batch-parallel-invalid.ts",
		"tests/output/batch-parallel-valid.ts",
		"tests/output/batch-invalid-1.ts",
		"tests/output/batch-valid.ts",
		"tests/output/batch-invalid-2.ts",
		"tests/output/batch-sequential-simple.ts",
		"tests/output/batch-sequential-constraints.ts",
		"tests/output/batch-sequential-invalid.ts",
		"tests/output/batch-sequential-valid.ts",
		"tests/output/batch-seq-first.ts",
		"tests/output/batch-seq-second.ts",
		"tests/output/batch-seq-third.ts",
		"tests/output/batch-exit-success.ts",
		"tests/output/batch-exit-mixed-1.ts",
		"tests/output/batch-exit-mixed-2.ts",
		"tests/output/batch-error-report.ts",
		...Array.from({ length: 10 }, (_, i) => `tests/output/batch-large-${i}.ts`),
	];

	afterEach(() => {
		// Cleanup generated files
		for (const file of outputFiles) {
			if (existsSync(file)) {
				unlinkSync(file);
			}
		}
	});

	describe("Parallel Execution", () => {
		it("should process multiple specs in parallel", async () => {
			const specs: SpecConfig[] = [
				{
					name: "simple",
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-parallel-simple.ts",
				},
				{
					name: "composition",
					input: "tests/fixtures/composition.yaml",
					output: "tests/output/batch-parallel-composition.ts",
				},
			];

			const summary = await executeBatch(specs, "parallel");

			expect(summary.total).toBe(2);
			expect(summary.successful).toBe(2);
			expect(summary.failed).toBe(0);
			expect(existsSync(specs[0].output)).toBe(true);
			expect(existsSync(specs[1].output)).toBe(true);
		});

		it("should collect all errors in parallel mode", async () => {
			const specs: SpecConfig[] = [
				{
					name: "invalid",
					input: "tests/fixtures/invalid-yaml.yaml",
					output: "tests/output/batch-parallel-invalid.ts",
				},
				{
					name: "valid",
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-parallel-valid.ts",
				},
			];

			const summary = await executeBatch(specs, "parallel");
			expect(summary.successful).toBe(1);
			expect(summary.failed).toBe(1);
			expect(summary.results[0].success).toBe(false);
			expect(summary.results[0].error).toBeDefined();
			expect(summary.results[1].success).toBe(true);
		});

		it("should continue processing all specs even if some fail", async () => {
			const specs: SpecConfig[] = [
				{
					name: "invalid-1",
					input: "tests/fixtures/non-existent.yaml",
					output: "tests/output/batch-invalid-1.ts",
				},
				{
					name: "valid",
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-valid.ts",
				},
				{
					name: "invalid-2",
					input: "tests/fixtures/invalid-yaml.yaml",
					output: "tests/output/batch-invalid-2.ts",
				},
			];

			const summary = await executeBatch(specs, "parallel");
			expect(summary.successful).toBe(1);
			expect(summary.failed).toBe(2);
			expect(existsSync(specs[1].output)).toBe(true);
		});
	});

	describe("Sequential Execution", () => {
		it("should process multiple specs sequentially", async () => {
			const specs: SpecConfig[] = [
				{
					name: "simple",
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-sequential-simple.ts",
				},
				{
					name: "constraints",
					input: "tests/fixtures/constraints.yaml",
					output: "tests/output/batch-sequential-constraints.ts",
				},
			];

			const summary = await executeBatch(specs, "sequential");
			expect(summary.successful).toBe(2);
			expect(summary.failed).toBe(0);
			expect(existsSync(specs[0].output)).toBe(true);
			expect(existsSync(specs[1].output)).toBe(true);
		});

		it("should collect all errors in sequential mode", async () => {
			const specs: SpecConfig[] = [
				{
					name: "invalid",
					input: "tests/fixtures/invalid-yaml.yaml",
					output: "tests/output/batch-sequential-invalid.ts",
				},
				{
					name: "valid",
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-sequential-valid.ts",
				},
			];

			const summary = await executeBatch(specs, "sequential");
			expect(summary.results[0].success).toBe(false);
			expect(summary.results[0].error).toBeDefined();
			expect(summary.results[1].success).toBe(true);
		});

		it("should process specs in order and continue on failure", async () => {
			const specs: SpecConfig[] = [
				{
					name: "first",
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-seq-first.ts",
				},
				{
					name: "second-fails",
					input: "tests/fixtures/invalid-yaml.yaml",
					output: "tests/output/batch-seq-second.ts",
				},
				{
					name: "third",
					input: "tests/fixtures/composition.yaml",
					output: "tests/output/batch-seq-third.ts",
				},
			];

			const summary = await executeBatch(specs, "sequential");
			expect(summary.results[0].success).toBe(true);
			expect(summary.results[1].success).toBe(false);
			expect(summary.results[2].success).toBe(true);
		});
	});

	describe("Exit Code Handling", () => {
		it("should return exit code 0 for all successful specs", async () => {
			const specs: SpecConfig[] = [
				{
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-exit-success.ts",
				},
			];

			const summary = await executeBatch(specs, "parallel");
			expect(getBatchExitCode(summary)).toBe(0);
		});

		it("should return exit code 1 if any spec fails", async () => {
			const specs: SpecConfig[] = [
				{
					input: "tests/fixtures/simple.yaml",
					output: "tests/output/batch-exit-mixed-1.ts",
				},
				{
					input: "tests/fixtures/invalid-yaml.yaml",
					output: "tests/output/batch-exit-mixed-2.ts",
				},
			];

			const summary = await executeBatch(specs, "parallel");
			expect(getBatchExitCode(summary)).toBe(1);
		});
	});

	describe("Error Reporting", () => {
		it("should report error messages without stack traces", async () => {
			const specs: SpecConfig[] = [
				{
					name: "invalid-file",
					input: "tests/fixtures/invalid-yaml.yaml",
					output: "tests/output/batch-error-report.ts",
				},
			];

			const summary = await executeBatch(specs, "parallel");
			expect(summary.failed).toBe(1);
			expect(summary.results[0].error).toBeDefined();
			expect(summary.results[0].error).toMatch(/Implicit keys need to be on a single line/);
		});
	});

	describe("Edge Cases", () => {
		it("should throw error if no specs provided", async () => {
			await expect(executeBatch([], "parallel")).rejects.toThrow(/No specs provided/);
		});

		it("should handle large batch of specs", async () => {
			const specs: SpecConfig[] = Array.from({ length: 10 }, (_, i) => ({
				name: `spec-${i}`,
				input: "tests/fixtures/simple.yaml",
				output: `tests/output/batch-large-${i}.ts`,
			}));

			const summary = await executeBatch(specs, "parallel");
			expect(summary.successful).toBe(10);
			expect(summary.failed).toBe(0);
		});
	});
});
