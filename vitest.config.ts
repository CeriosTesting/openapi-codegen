import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@cerios/openapi-to-zod": path.resolve(__dirname, "packages/openapi-to-zod/src"),
			"@cerios/openapi-to-zod-playwright": path.resolve(__dirname, "packages/openapi-to-zod-playwright/src"),
		},
	},
	test: {
		environment: "node",
		globals: true,
		include: ["packages/*/tests/**/*.test.ts"],
		coverage: {
			include: ["packages/*/src/**/*.ts"],
			exclude: ["packages/*/src/**/*.d.ts"],
			reporter: ["text", "lcov", "html"],
		},
		clearMocks: true,
		restoreMocks: true,
		mockReset: true,
		cache: false,
		isolate: true,
	},
});
