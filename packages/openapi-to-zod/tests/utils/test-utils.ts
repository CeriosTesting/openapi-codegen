import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

export abstract class TestUtils {
	static getConfigPath(configFileName: string): string {
		return path.join(path.join(__dirname, "..", "fixtures", "config-files"), configFileName);
	}

	static getOutputPath(outputFileName: string): string {
		return path.join(path.join(__dirname, "..", "output"), outputFileName);
	}

	static getFixturePath(fixtureName: string): string {
		return path.join(path.join(__dirname, "..", "fixtures"), fixtureName);
	}

	static getDistPath(distFileName: string): string {
		return path.join(path.join(__dirname, "..", "..", "dist"), distFileName);
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
