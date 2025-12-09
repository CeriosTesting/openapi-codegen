import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { ZodSchemaGenerator } from "../../src/generator";
import type { GeneratorOptions } from "../../src/types";

/**
 * Utility functions for testing the OpenAPI to Zod generator
 */
export const TestUtils = {
	getConfigPath(configFileName: string): string {
		return path.join(__dirname, "..", "fixtures", "config-files", configFileName);
	},

	getOutputPath(outputFileName: string): string {
		return path.join(__dirname, "..", "output", outputFileName);
	},

	getFixturePath(fixtureName: string): string {
		return path.join(__dirname, "..", "fixtures", fixtureName);
	},

	getDistPath(distFileName: string): string {
		return path.join(__dirname, "..", "..", "dist", distFileName);
	},

	cleanupTestOutput(outputFileName: string): () => void {
		return () => {
			const outputFilePath = this.getOutputPath(outputFileName);
			if (existsSync(outputFilePath)) {
				unlinkSync(outputFilePath);
			}
		};
	},

	/**
	 * Generate Zod schemas from a fixture file
	 * @param fixtureName - Name of the fixture file in the fixtures directory
	 * @param options - Partial generator options to merge with defaults
	 * @returns Generated Zod schema string
	 */
	generateFromFixture(fixtureName: string, options?: Partial<GeneratorOptions>): string {
		const generator = new ZodSchemaGenerator({
			input: this.getFixturePath(fixtureName),
			...options,
		});
		return generator.generateString();
	},
} as const;
