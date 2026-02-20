import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			"packages/openapi-core/vitest.config.ts",
			"packages/openapi-to-k6/vitest.config.ts",
			"packages/openapi-to-typescript/vitest.config.ts",
			"packages/openapi-to-zod/vitest.config.ts",
			"packages/openapi-to-zod-playwright/vitest.config.ts",
		],
	},
});
