import * as fs from "node:fs";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadConfig, mergeConfigWithDefaults } from "../src/utils/config-loader";

describe("Config Loader", () => {
	const testDir = path.join(__dirname, "temp-config-test");

	beforeEach(() => {
		if (!fs.existsSync(testDir)) {
			fs.mkdirSync(testDir, { recursive: true });
		}
	});

	afterEach(() => {
		if (fs.existsSync(testDir)) {
			fs.rmSync(testDir, { recursive: true, force: true });
		}
	});

	describe("loadConfig", () => {
		it("should load a JSON config file", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
					},
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			const loaded = await loadConfig(configPath);
			expect(loaded.specs).toHaveLength(1);
			expect(loaded.specs[0].input).toBe("api.yaml");
			expect(loaded.specs[0].outputClient).toBe("client.ts");
			expect(loaded.specs[0].outputTypes).toBe("types.ts");
		});

		it("should load config with fileHeader in spec", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
						fileHeader: ["// custom-header"],
					},
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			const loaded = await loadConfig(configPath);
			expect(loaded.specs[0].fileHeader).toEqual(["// custom-header"]);
		});

		it("should load config with fileHeader in defaults", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				defaults: {
					fileHeader: ["// default-header"],
				},
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
					},
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			const loaded = await loadConfig(configPath);
			expect(loaded.defaults?.fileHeader).toEqual(["// default-header"]);
		});

		it("should load config with multiple fileHeader lines", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
						fileHeader: [
							"// oxlint-disable typescript/no-unsafe-type-assertion",
							"// oxlint-disable typescript/no-unsafe-assignment",
						],
					},
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			const loaded = await loadConfig(configPath);
			expect(loaded.specs[0].fileHeader).toEqual([
				"// oxlint-disable typescript/no-unsafe-type-assertion",
				"// oxlint-disable typescript/no-unsafe-assignment",
			]);
		});

		it("should reject invalid fileHeader type", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
						fileHeader: "not-an-array",
					},
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			await expect(loadConfig(configPath)).rejects.toThrow();
		});

		it("should throw error for non-existent file", async () => {
			const configPath = path.join(testDir, "non-existent.json");
			await expect(loadConfig(configPath)).rejects.toThrow();
		});

		it("should load config with defaults", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				defaults: {
					includeDescriptions: true,
					basePath: "/api/v1",
				},
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
					},
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			const loaded = await loadConfig(configPath);
			expect(loaded.defaults?.includeDescriptions).toBe(true);
			expect(loaded.defaults?.basePath).toBe("/api/v1");
		});

		it("should load config with multiple specs", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				specs: [
					{ input: "api1.yaml", outputClient: "client1.ts", outputTypes: "types1.ts" },
					{ input: "api2.yaml", outputClient: "client2.ts", outputTypes: "types2.ts" },
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			const loaded = await loadConfig(configPath);
			expect(loaded.specs).toHaveLength(2);
		});

		it("should reject config without specs", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				defaults: {
					basePath: "/api",
				},
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			await expect(loadConfig(configPath)).rejects.toThrow();
		});

		it("should load config with executionMode", async () => {
			const configPath = path.join(testDir, "openapi-to-k6.config.json");
			const config = {
				executionMode: "parallel",
				specs: [
					{ input: "api1.yaml", outputClient: "client1.ts", outputTypes: "types1.ts" },
					{ input: "api2.yaml", outputClient: "client2.ts", outputTypes: "types2.ts" },
				],
			};
			fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

			const loaded = await loadConfig(configPath);
			expect(loaded.executionMode).toBe("parallel");
		});
	});

	describe("mergeConfigWithDefaults", () => {
		it("should merge fileHeader from defaults", () => {
			const config = {
				defaults: {
					fileHeader: ["// default-header"],
					includeDescriptions: true,
				},
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
					},
				],
			};

			const merged = mergeConfigWithDefaults(config);

			expect(merged[0].fileHeader).toEqual(["// default-header"]);
			expect(merged[0].includeDescriptions).toBe(true);
		});

		it("should allow spec fileHeader to override defaults", () => {
			const config = {
				defaults: {
					fileHeader: ["// default-header"],
				},
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
						fileHeader: ["// spec-header"],
					},
				],
			};

			const merged = mergeConfigWithDefaults(config);

			expect(merged[0].fileHeader).toEqual(["// spec-header"]);
		});

		it("should allow spec to disable fileHeader with empty array", () => {
			const config = {
				defaults: {
					fileHeader: ["// default-header"],
				},
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
						fileHeader: [],
					},
				],
			};

			const merged = mergeConfigWithDefaults(config);

			expect(merged[0].fileHeader).toEqual([]);
		});

		it("should handle config without fileHeader", () => {
			const config = {
				defaults: {
					includeDescriptions: true,
				},
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
					},
				],
			};

			const merged = mergeConfigWithDefaults(config);

			expect(merged[0].fileHeader).toBeUndefined();
		});

		it("should merge multiple defaults with spec overrides", () => {
			const config = {
				defaults: {
					basePath: "/api",
					includeDescriptions: true,
					fileHeader: ["// header"],
				},
				specs: [
					{
						input: "api.yaml",
						outputClient: "client.ts",
						outputTypes: "types.ts",
						basePath: "/api/v2",
					},
				],
			};

			const merged = mergeConfigWithDefaults(config);

			expect(merged[0].basePath).toBe("/api/v2");
			expect(merged[0].includeDescriptions).toBe(true);
			expect(merged[0].fileHeader).toEqual(["// header"]);
		});

		it("should throw error when config has no specs", () => {
			const config = {
				defaults: {},
			};

			// @ts-expect-error - intentionally invalid config
			expect(() => mergeConfigWithDefaults(config)).toThrow("Invalid config: specs array is required");
		});
	});
});
