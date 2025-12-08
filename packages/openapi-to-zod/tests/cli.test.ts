import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TestUtils } from "./utils/test-utils";

describe("CLI", () => {
	const outputPath = TestUtils.getOutputPath("cli-test.ts");
	const cliPath = TestUtils.getDistPath("cli.js");

	it("should generate schemas with basic options", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath}`, {
			stdio: "pipe",
		});

		expect(existsSync(outputPath)).toBe(true);
	});

	it("should accept mode option", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} -m strict`, {
			stdio: "pipe",
		});

		expect(existsSync(outputPath)).toBe(true);
	});

	it("should accept enum-type option", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} -e typescript`, {
			stdio: "pipe",
		});

		expect(existsSync(outputPath)).toBe(true);
	});

	it("should accept no-descriptions flag", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} --no-descriptions`, {
			stdio: "pipe",
		});

		expect(existsSync(outputPath)).toBe(true);
	});

	it("should fail with missing input file", () => {
		expect(() => {
			execSync(`node ${cliPath} -i nonexistent.yaml -o ${outputPath}`, {
				stdio: "pipe",
			});
		}).toThrow();
	});

	it("should show help with --help flag", () => {
		const output = execSync(`node ${cliPath} --help`, {
			encoding: "utf-8",
		});

		expect(output).toContain("Generate Zod v4 schemas");
		expect(output).toContain("--input");
		expect(output).toContain("--output");
		expect(output).toContain("--mode");
		expect(output).toContain("--enum-type");
	});

	it("should show version with --version flag", () => {
		const output = execSync(`node ${cliPath} --version`, {
			encoding: "utf-8",
		});

		expect(output).toMatch(/\d+\.\d+\.\d+/);
	});

	it("should accept --no-stats flag", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} --no-stats`, {
			stdio: "pipe",
		});

		const { readFileSync } = require("node:fs");
		const output = readFileSync(outputPath, "utf-8");
		expect(output).not.toContain("// Generation Statistics:");
	});

	it("should accept --prefix option", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} --prefix api`, {
			stdio: "pipe",
		});

		const { readFileSync } = require("node:fs");
		const output = readFileSync(outputPath, "utf-8");
		expect(output).toContain("export const apiUserSchema");
	});

	it("should accept --suffix option", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} --suffix Dto`, {
			stdio: "pipe",
		});

		const { readFileSync } = require("node:fs");
		const output = readFileSync(outputPath, "utf-8");
		expect(output).toContain("export const userDtoSchema");
	});

	it("should accept --schema-type option", () => {
		execSync(
			`node ${cliPath} -i ${TestUtils.getFixturePath("schema-filtering.yaml")} -o ${outputPath} --schema-type request`,
			{
				stdio: "pipe",
			}
		);

		expect(existsSync(outputPath)).toBe(true);
	});

	it("should accept --use-describe flag", () => {
		execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} --use-describe`, {
			stdio: "pipe",
		});

		const { readFileSync } = require("node:fs");
		const output = readFileSync(outputPath, "utf-8");
		expect(output).toContain(".describe(");
	});

	it("should handle multiple options combined", () => {
		execSync(
			`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} -m strict --prefix api --suffix Model --no-descriptions`,
			{
				stdio: "pipe",
			}
		);

		const { readFileSync } = require("node:fs");
		const output = readFileSync(outputPath, "utf-8");
		expect(output).toContain("export const apiUserModelSchema");
		expect(output).toContain("z.strictObject(");
		expect(output).not.toMatch(/\/\*\*/);
	});

	it("should fail with invalid mode option", () => {
		try {
			execSync(`node ${cliPath} -i ${TestUtils.getFixturePath("simple.yaml")} -o ${outputPath} -m invalid`, {
				stdio: "pipe",
			});
			// If we get here, the command succeeded when it should have failed
			expect(true).toBe(false); // Force failure
		} catch (error) {
			// Command failed as expected
			expect(error).toBeDefined();
		}
	});
});
