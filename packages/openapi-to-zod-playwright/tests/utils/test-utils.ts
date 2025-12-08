import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

export const outputDir = path.join(__dirname, "..", "output");
export const fixturesDir = path.join(__dirname, "..", "fixtures");

export abstract class TestUtils {
	static getOutputPath(outputFileName: string): string {
		return path.join(outputDir, outputFileName);
	}

	static getFixturePath(fixtureName: string): string {
		return path.join(fixturesDir, fixtureName);
	}

	static cleanupTestOutput(outputFileName: string): () => void {
		return () => {
			const outputFilePath = this.getOutputPath(outputFileName);
			if (existsSync(outputFilePath)) {
				unlinkSync(outputFilePath);
			}
		};
	}
}
