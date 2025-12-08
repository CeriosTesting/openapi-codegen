import { describe, expect, it } from "vitest";
import { ZodSchemaGenerator } from "../src/generator";
import type { GeneratorOptions } from "../src/types";
import { TestUtils } from "./utils/test-utils";

describe("Zod Import Deduplication", () => {
	function generateOutput(fixture: string, options?: Partial<GeneratorOptions>): string {
		const generator = new ZodSchemaGenerator({
			input: TestUtils.getFixturePath(fixture),
			...options,
		});
		return generator.generateString();
	}

	it("should only have one Zod import statement", () => {
		const content = generateOutput("type-mode.yaml", { typeMode: "inferred" });
		const zodImports = content.match(/import\s+{\s*z\s*}\s+from\s+["']zod["']/g);

		expect(zodImports).toBeDefined();
		expect(zodImports).toHaveLength(1);
	});

	it("should have Zod import when generating enums in inferred mode", () => {
		const content = generateOutput("type-mode.yaml", { typeMode: "inferred" });

		// Should have Zod import
		expect(content).toContain('import { z } from "zod"');

		// Should have enum schemas
		expect(content).toContain("userStatusSchema");
		expect(content).toContain('z.enum(["active", "inactive", "suspended"])');
	});

	it("should not have Zod import when all schemas are native", () => {
		const content = generateOutput("type-mode.yaml", { typeMode: "native" });

		// Should NOT have Zod import
		expect(content).not.toContain('import { z } from "zod"');

		// Should have native enum types
		expect(content).toContain('export type UserStatus = "active" | "inactive" | "suspended"');
	});

	it("should have Zod import when mixing native and inferred modes", () => {
		const content = generateOutput("type-mode.yaml", {
			request: {
				typeMode: "native",
			},
			response: {
				typeMode: "inferred",
			},
		});
		const zodImports = content.match(/import\s+{\s*z\s*}\s+from\s+["']zod["']/g);

		// Should have exactly one Zod import (for response schemas)
		expect(zodImports).toBeDefined();
		expect(zodImports).toHaveLength(1);

		// Should have both native types and Zod schemas
		expect(content).toContain("export type CreateUserRequest");
		expect(content).toContain("export const userSchema");
	});

	it("should have single Zod import even with multiple enum schemas", () => {
		const content = generateOutput("composition.yaml", { typeMode: "inferred" });
		const zodImports = content.match(/import\s+{\s*z\s*}\s+from\s+["']zod["']/g);

		// Should have exactly one Zod import regardless of number of schemas
		expect(zodImports).toBeDefined();
		expect(zodImports).toHaveLength(1);
	});
});
