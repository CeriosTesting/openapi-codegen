import { execSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { ZodSchemaGenerator } from "../src/generator";
import type { GeneratorOptions } from "../src/types";
import { TestUtils } from "./utils/test-utils";

describe("Comprehensive Compilation Tests", () => {
	const outputFiles: string[] = [];

	// Helper to track and generate output
	function generateAndTrack(name: string, options: GeneratorOptions): void {
		const outputPath = TestUtils.getOutputPath(`compilation-${name}.ts`);
		outputFiles.push(outputPath);

		const generator = new ZodSchemaGenerator({
			...options,
			output: outputPath,
		});
		generator.generate();
	}

	// Helper to check TypeScript compilation
	function expectToCompile(outputPath: string): void {
		expect(() => {
			execSync(`npx tsc --noEmit --skipLibCheck ${outputPath}`, {
				stdio: "pipe",
			});
		}).not.toThrow();
	}

	describe("Mode Options", () => {
		it("should compile with mode: strict", () => {
			const outputPath = TestUtils.getOutputPath("compilation-mode-strict.ts");
			generateAndTrack("mode-strict", {
				input: TestUtils.getFixturePath("simple.yaml"),
				mode: "strict",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with mode: normal", () => {
			const outputPath = TestUtils.getOutputPath("compilation-mode-normal.ts");
			generateAndTrack("mode-normal", {
				input: TestUtils.getFixturePath("simple.yaml"),
				mode: "normal",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with mode: loose", () => {
			const outputPath = TestUtils.getOutputPath("compilation-mode-loose.ts");
			generateAndTrack("mode-loose", {
				input: TestUtils.getFixturePath("simple.yaml"),
				mode: "loose",
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("TypeMode Options", () => {
		it("should compile with typeMode: inferred", () => {
			const outputPath = TestUtils.getOutputPath("compilation-typemode-inferred.ts");
			generateAndTrack("typemode-inferred", {
				input: TestUtils.getFixturePath("complex.yaml"),
				typeMode: "inferred",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with typeMode: native", () => {
			const outputPath = TestUtils.getOutputPath("compilation-typemode-native.ts");
			generateAndTrack("typemode-native", {
				input: TestUtils.getFixturePath("complex.yaml"),
				typeMode: "native",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with mixed typeMode (request native, response inferred)", () => {
			const outputPath = TestUtils.getOutputPath("compilation-typemode-mixed.ts");
			generateAndTrack("typemode-mixed", {
				input: TestUtils.getFixturePath("type-mode.yaml"),
				typeMode: "inferred",
				request: {
					typeMode: "native",
				},
				response: {
					typeMode: "inferred",
				},
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("Enum Options", () => {
		it("should compile with enumType: zod", () => {
			const outputPath = TestUtils.getOutputPath("compilation-enum-zod.ts");
			generateAndTrack("enum-zod", {
				input: TestUtils.getFixturePath("complex.yaml"),
				enumType: "zod",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with enumType: typescript", () => {
			const outputPath = TestUtils.getOutputPath("compilation-enum-typescript.ts");
			generateAndTrack("enum-typescript", {
				input: TestUtils.getFixturePath("complex.yaml"),
				enumType: "typescript",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with nativeEnumType: union (native mode)", () => {
			const outputPath = TestUtils.getOutputPath("compilation-native-enum-union.ts");
			generateAndTrack("native-enum-union", {
				input: TestUtils.getFixturePath("complex.yaml"),
				typeMode: "native",
				nativeEnumType: "union",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with nativeEnumType: enum (native mode)", () => {
			const outputPath = TestUtils.getOutputPath("compilation-native-enum-enum.ts");
			generateAndTrack("native-enum-enum", {
				input: TestUtils.getFixturePath("complex.yaml"),
				typeMode: "native",
				nativeEnumType: "enum",
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("Description Options", () => {
		it("should compile with includeDescriptions: true", () => {
			const outputPath = TestUtils.getOutputPath("compilation-descriptions-true.ts");
			generateAndTrack("descriptions-true", {
				input: TestUtils.getFixturePath("documentation.yaml"),
				includeDescriptions: true,
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with includeDescriptions: false", () => {
			const outputPath = TestUtils.getOutputPath("compilation-descriptions-false.ts");
			generateAndTrack("descriptions-false", {
				input: TestUtils.getFixturePath("documentation.yaml"),
				includeDescriptions: false,
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with useDescribe: true", () => {
			const outputPath = TestUtils.getOutputPath("compilation-use-describe-true.ts");
			generateAndTrack("use-describe-true", {
				input: TestUtils.getFixturePath("simple.yaml"),
				useDescribe: true,
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with useDescribe: false", () => {
			const outputPath = TestUtils.getOutputPath("compilation-use-describe-false.ts");
			generateAndTrack("use-describe-false", {
				input: TestUtils.getFixturePath("simple.yaml"),
				useDescribe: false,
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("SchemaType Options", () => {
		it("should compile with schemaType: all", () => {
			const outputPath = TestUtils.getOutputPath("compilation-schematype-all.ts");
			generateAndTrack("schematype-all", {
				input: TestUtils.getFixturePath("simple.yaml"),
				schemaType: "all",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with schemaType: request", () => {
			const outputPath = TestUtils.getOutputPath("compilation-schematype-request.ts");
			generateAndTrack("schematype-request", {
				input: TestUtils.getFixturePath("type-mode.yaml"),
				schemaType: "request",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with schemaType: response", () => {
			const outputPath = TestUtils.getOutputPath("compilation-schematype-response.ts");
			generateAndTrack("schematype-response", {
				input: TestUtils.getFixturePath("type-mode.yaml"),
				schemaType: "response",
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("Naming Options", () => {
		it("should compile with prefix", () => {
			const outputPath = TestUtils.getOutputPath("compilation-prefix.ts");
			generateAndTrack("prefix", {
				input: TestUtils.getFixturePath("simple.yaml"),
				prefix: "api",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with suffix", () => {
			const outputPath = TestUtils.getOutputPath("compilation-suffix.ts");
			generateAndTrack("suffix", {
				input: TestUtils.getFixturePath("simple.yaml"),
				suffix: "dto",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with both prefix and suffix", () => {
			const outputPath = TestUtils.getOutputPath("compilation-prefix-suffix.ts");
			generateAndTrack("prefix-suffix", {
				input: TestUtils.getFixturePath("simple.yaml"),
				prefix: "api",
				suffix: "model",
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("Complex Fixtures", () => {
		it("should compile circular references", () => {
			const outputPath = TestUtils.getOutputPath("compilation-circular.ts");
			generateAndTrack("circular", {
				input: TestUtils.getFixturePath("circular.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile composition schemas (allOf, oneOf, anyOf)", () => {
			const outputPath = TestUtils.getOutputPath("compilation-composition.ts");
			generateAndTrack("composition", {
				input: TestUtils.getFixturePath("composition.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile discriminator mappings", () => {
			const outputPath = TestUtils.getOutputPath("compilation-discriminator.ts");
			generateAndTrack("discriminator", {
				input: TestUtils.getFixturePath("discriminator-mapping.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile pattern properties", () => {
			const outputPath = TestUtils.getOutputPath("compilation-pattern-props.ts");
			generateAndTrack("pattern-props", {
				input: TestUtils.getFixturePath("pattern-properties.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile array contains schemas", () => {
			const outputPath = TestUtils.getOutputPath("compilation-array-contains.ts");
			generateAndTrack("array-contains", {
				input: TestUtils.getFixturePath("array-contains.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile schema dependencies", () => {
			const outputPath = TestUtils.getOutputPath("compilation-dependencies.ts");
			generateAndTrack("dependencies", {
				input: TestUtils.getFixturePath("dependencies.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile unevaluated properties", () => {
			const outputPath = TestUtils.getOutputPath("compilation-unevaluated.ts");
			generateAndTrack("unevaluated", {
				input: TestUtils.getFixturePath("unevaluated.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile not keyword schemas", () => {
			const outputPath = TestUtils.getOutputPath("compilation-not-keyword.ts");
			generateAndTrack("not-keyword", {
				input: TestUtils.getFixturePath("not-keyword.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile content encoding schemas", () => {
			const outputPath = TestUtils.getOutputPath("compilation-content-encoding.ts");
			generateAndTrack("content-encoding", {
				input: TestUtils.getFixturePath("content-encoding.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile content media type schemas", () => {
			const outputPath = TestUtils.getOutputPath("compilation-content-media-type.ts");
			generateAndTrack("content-media-type", {
				input: TestUtils.getFixturePath("content-media-type.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile format constraints", () => {
			const outputPath = TestUtils.getOutputPath("compilation-formats.ts");
			generateAndTrack("formats", {
				input: TestUtils.getFixturePath("formats.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile various constraints", () => {
			const outputPath = TestUtils.getOutputPath("compilation-constraints.ts");
			generateAndTrack("constraints", {
				input: TestUtils.getFixturePath("constraints.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("Combined Options", () => {
		it("should compile with all options enabled", () => {
			const outputPath = TestUtils.getOutputPath("compilation-all-options.ts");
			generateAndTrack("all-options", {
				input: TestUtils.getFixturePath("complex.yaml"),
				mode: "strict",
				typeMode: "inferred",
				enumType: "typescript",
				includeDescriptions: true,
				useDescribe: true,
				showStats: true,
				prefix: "api",
				suffix: "dto",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with native types and all features", () => {
			const outputPath = TestUtils.getOutputPath("compilation-native-all-features.ts");
			generateAndTrack("native-all-features", {
				input: TestUtils.getFixturePath("complex.yaml"),
				mode: "loose",
				typeMode: "native",
				nativeEnumType: "enum",
				includeDescriptions: true,
				showStats: false,
				prefix: "v1",
				suffix: "type",
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with request/response overrides", () => {
			const outputPath = TestUtils.getOutputPath("compilation-request-response.ts");
			generateAndTrack("request-response", {
				input: TestUtils.getFixturePath("type-mode.yaml"),
				typeMode: "inferred",
				mode: "normal",
				request: {
					typeMode: "native",
					mode: "strict",
					includeDescriptions: false,
				},
				response: {
					typeMode: "inferred",
					mode: "loose",
					useDescribe: true,
					includeDescriptions: true,
				},
			});
			expectToCompile(outputPath);
		}, 10000);
	});

	describe("Edge Cases", () => {
		it("should compile empty schemas (defaulting to z.unknown())", () => {
			const outputPath = TestUtils.getOutputPath("compilation-empty-schemas.ts");
			generateAndTrack("empty-schemas", {
				input: TestUtils.getFixturePath("empty-schemas.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile with nested writeOnly properties", () => {
			const outputPath = TestUtils.getOutputPath("compilation-nested-writeonly.ts");
			generateAndTrack("nested-writeonly", {
				input: TestUtils.getFixturePath("nested-writeonly.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);

		it("should compile advanced formats", () => {
			const outputPath = TestUtils.getOutputPath("compilation-advanced-formats.ts");
			generateAndTrack("advanced-formats", {
				input: TestUtils.getFixturePath("advanced-formats.yaml"),
			});
			expectToCompile(outputPath);
		}, 10000);
	});
});
