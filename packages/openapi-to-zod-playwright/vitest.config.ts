import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
			"@cerios/openapi-to-zod": path.resolve(__dirname, "../openapi-to-zod/src"),
			"@cerios/openapi-to-zod-playwright": path.resolve(__dirname, "./src"),
		},
	},
	test: {
		environment: "node",
		globals: true,
		include: ["tests/**/*.test.ts"],
		coverage: {
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.d.ts"],
			reporter: ["text", "lcov", "html"],
		},
		clearMocks: true,
		restoreMocks: true,
		mockReset: true,
	},
});
