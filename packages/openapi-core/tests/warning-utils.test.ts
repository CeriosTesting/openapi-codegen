import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createWarningLogger, WarningCollector } from "../src/utils/warning-utils";

describe("warning-utils", () => {
	describe("createWarningLogger", () => {
		beforeEach(() => {
			vi.spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should log warning with package prefix when enabled", () => {
			const warn = createWarningLogger({
				packageName: "@cerios/openapi-to-zod",
				enabled: true,
			});

			warn("Something went wrong");

			expect(console.warn).toHaveBeenCalledWith("[@cerios/openapi-to-zod] Warning: Something went wrong");
		});

		it("should not log when disabled", () => {
			const warn = createWarningLogger({
				packageName: "@cerios/openapi-to-zod",
				enabled: false,
			});

			warn("Something went wrong");

			expect(console.warn).not.toHaveBeenCalled();
		});

		it("should use different package names correctly", () => {
			const warn = createWarningLogger({
				packageName: "@cerios/openapi-to-k6",
				enabled: true,
			});

			warn("Test message");

			expect(console.warn).toHaveBeenCalledWith("[@cerios/openapi-to-k6] Warning: Test message");
		});
	});

	describe("WarningCollector", () => {
		beforeEach(() => {
			vi.spyOn(console, "warn").mockImplementation(() => {});
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		describe("add", () => {
			it("should collect warnings when enabled", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				collector.add("Warning 1");
				collector.add("Warning 2");

				expect(collector.getWarnings()).toEqual(["Warning 1", "Warning 2"]);
			});

			it("should not collect warnings when disabled", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: false,
				});

				collector.add("Warning 1");
				collector.add("Warning 2");

				expect(collector.getWarnings()).toEqual([]);
			});
		});

		describe("hasWarnings", () => {
			it("should return false when no warnings", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				expect(collector.hasWarnings()).toBe(false);
			});

			it("should return true when warnings exist", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				collector.add("Warning");

				expect(collector.hasWarnings()).toBe(true);
			});
		});

		describe("count", () => {
			it("should return number of collected warnings", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				expect(collector.count).toBe(0);

				collector.add("Warning 1");
				expect(collector.count).toBe(1);

				collector.add("Warning 2");
				expect(collector.count).toBe(2);
			});
		});

		describe("flush", () => {
			it("should output warnings to console in dedicated section", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				collector.add("Warning 1");
				collector.add("Warning 2");
				collector.flush();

				expect(console.warn).toHaveBeenCalledTimes(4); // header + 2 warnings + empty line
				expect(console.warn).toHaveBeenNthCalledWith(1, "\n[@cerios/openapi-to-zod] Warnings:");
				expect(console.warn).toHaveBeenNthCalledWith(2, "  ⚠️  Warning 1");
				expect(console.warn).toHaveBeenNthCalledWith(3, "  ⚠️  Warning 2");
				expect(console.warn).toHaveBeenNthCalledWith(4, "");
			});

			it("should not output anything when no warnings", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				collector.flush();

				expect(console.warn).not.toHaveBeenCalled();
			});

			it("should not output anything when disabled", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: false,
				});

				// Add would be ignored anyway, but test the full flow
				collector.add("Warning");
				collector.flush();

				expect(console.warn).not.toHaveBeenCalled();
			});
		});

		describe("clear", () => {
			it("should remove all collected warnings", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				collector.add("Warning 1");
				collector.add("Warning 2");
				expect(collector.count).toBe(2);

				collector.clear();

				expect(collector.count).toBe(0);
				expect(collector.hasWarnings()).toBe(false);
				expect(collector.getWarnings()).toEqual([]);
			});
		});

		describe("getWarnings", () => {
			it("should return readonly array of warnings", () => {
				const collector = new WarningCollector({
					packageName: "@cerios/openapi-to-zod",
					enabled: true,
				});

				collector.add("Warning 1");
				const warnings = collector.getWarnings();

				expect(warnings).toEqual(["Warning 1"]);
				// The returned array should be readonly (compile-time check)
				// Runtime modification would require casting
			});
		});
	});
});
