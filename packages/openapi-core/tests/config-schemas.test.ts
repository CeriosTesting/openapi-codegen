import { describe, expect, it } from "vitest";

import {
	BaseDefaultsSchema,
	BaseGeneratorOptionsSchema,
	ExecutionModeSchema,
	OperationFiltersSchema,
} from "../src/utils/config-schemas";

describe("Config Schemas", () => {
	describe("BaseGeneratorOptionsSchema", () => {
		it("should accept valid minimal config", () => {
			const config = {
				input: "api.yaml",
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		it("should accept fileHeader option", () => {
			const config = {
				input: "api.yaml",
				outputTypes: "types.ts",
				fileHeader: ["// custom-header"],
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.fileHeader).toEqual(["// custom-header"]);
			}
		});

		it("should accept multiple fileHeader lines", () => {
			const config = {
				input: "api.yaml",
				outputTypes: "types.ts",
				fileHeader: ["// line1", "// line2", "// line3"],
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.fileHeader).toEqual(["// line1", "// line2", "// line3"]);
			}
		});

		it("should accept empty fileHeader array", () => {
			const config = {
				input: "api.yaml",
				outputTypes: "types.ts",
				fileHeader: [],
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.fileHeader).toEqual([]);
			}
		});

		it("should accept config without fileHeader", () => {
			const config = {
				input: "api.yaml",
				outputTypes: "types.ts",
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.fileHeader).toBeUndefined();
			}
		});

		it("should reject non-array fileHeader", () => {
			const config = {
				input: "api.yaml",
				outputTypes: "types.ts",
				fileHeader: "not-an-array",
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(false);
		});

		it("should reject non-string array elements in fileHeader", () => {
			const config = {
				input: "api.yaml",
				outputTypes: "types.ts",
				fileHeader: [123, true],
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(false);
		});

		it("should accept showWarnings option", () => {
			const config = {
				input: "api.yaml",
				showWarnings: false,
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.showWarnings).toBe(false);
			}
		});

		it("should accept all base options together", () => {
			const config = {
				input: "api.yaml",
				outputTypes: "types.ts",
				includeDescriptions: true,
				defaultNullable: false,
				stripSchemaPrefix: "Company.Models.",
				stripPathPrefix: "/api/v1",
				useOperationId: true,
				prefix: "Api",
				suffix: "Dto",
				operationFilters: {
					includeTags: ["public"],
				},
				showStats: true,
				showWarnings: true,
				batchSize: 5,
				fileHeader: ["// custom header"],
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(true);
		});

		it("should reject unrecognized keys (strictObject)", () => {
			const config = {
				input: "api.yaml",
				unknownOption: "value",
			};

			const result = BaseGeneratorOptionsSchema.safeParse(config);
			expect(result.success).toBe(false);
		});
	});

	describe("BaseDefaultsSchema", () => {
		it("should accept fileHeader in defaults", () => {
			const defaults = {
				fileHeader: ["// default-header"],
				includeDescriptions: true,
			};

			const result = BaseDefaultsSchema.safeParse(defaults);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.fileHeader).toEqual(["// default-header"]);
			}
		});

		it("should not allow input in defaults", () => {
			const defaults = {
				input: "api.yaml",
				fileHeader: ["// header"],
			};

			const result = BaseDefaultsSchema.safeParse(defaults);
			expect(result.success).toBe(false);
		});

		it("should not allow outputTypes in defaults", () => {
			const defaults = {
				outputTypes: "types.ts",
				fileHeader: ["// header"],
			};

			const result = BaseDefaultsSchema.safeParse(defaults);
			expect(result.success).toBe(false);
		});

		it("should not allow name in defaults", () => {
			const defaults = {
				name: "test-spec",
				fileHeader: ["// header"],
			};

			const result = BaseDefaultsSchema.safeParse(defaults);
			expect(result.success).toBe(false);
		});

		it("should accept showWarnings in defaults", () => {
			const defaults = {
				showWarnings: false,
			};

			const result = BaseDefaultsSchema.safeParse(defaults);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.showWarnings).toBe(false);
			}
		});
	});

	describe("OperationFiltersSchema", () => {
		it("should accept empty object", () => {
			const filters = {};

			const result = OperationFiltersSchema.safeParse(filters);
			expect(result.success).toBe(true);
		});

		it("should accept all filter options", () => {
			const filters = {
				includeTags: ["public", "api"],
				excludeTags: ["internal"],
				includePaths: ["/api/**"],
				excludePaths: ["/internal/**"],
				includeMethods: ["get", "post"],
				excludeMethods: ["delete"],
				includeOperationIds: ["getUser*"],
				excludeOperationIds: ["*Internal"],
				excludeDeprecated: true,
			};

			const result = OperationFiltersSchema.safeParse(filters);
			expect(result.success).toBe(true);
		});
	});

	describe("ExecutionModeSchema", () => {
		it("should accept 'parallel'", () => {
			const result = ExecutionModeSchema.safeParse("parallel");
			expect(result.success).toBe(true);
		});

		it("should accept 'sequential'", () => {
			const result = ExecutionModeSchema.safeParse("sequential");
			expect(result.success).toBe(true);
		});

		it("should reject invalid mode", () => {
			const result = ExecutionModeSchema.safeParse("invalid");
			expect(result.success).toBe(false);
		});
	});
});
