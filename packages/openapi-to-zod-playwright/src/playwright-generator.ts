import { readFileSync, writeFileSync } from "node:fs";
import type { OpenAPISpec } from "@cerios/openapi-to-zod";
import { ZodSchemaGenerator } from "@cerios/openapi-to-zod";
import { parse } from "yaml";
import { generateClientClass } from "./generators/client-generator";
import { generateServiceClass } from "./generators/service-generator";
import type { PlaywrightGeneratorOptions } from "./types";

/**
 * Main generator class for Playwright API clients
 * Generates Zod schemas, then appends client and service classes
 */
export class PlaywrightGenerator {
	private options: PlaywrightGeneratorOptions & { schemaType: "all" };
	private spec: OpenAPISpec | null = null;

	constructor(options: PlaywrightGeneratorOptions) {
		this.options = {
			mode: options.mode || "normal",
			typeMode: options.typeMode || "inferred",
			enumType: options.enumType || "zod",
			nativeEnumType: options.nativeEnumType || "union",
			includeDescriptions: options.includeDescriptions ?? true,
			useDescribe: options.useDescribe ?? false,
			showStats: options.showStats ?? true,
			prefix: options.prefix || "",
			suffix: options.suffix || "",
			...options,
			schemaType: "all", // Always enforce all schemas
		};
	}

	/**
	 * Generate the complete output file
	 */
	generate(): void {
		if (!this.options.output) {
			throw new Error(
				"Output path is required when calling generate(). " +
					"Either provide an 'output' option or use generateString() to get the result as a string."
			);
		}

		// biome-ignore lint/suspicious/noConsole: CLI output
		console.log(`Generating Playwright client for ${this.options.input}...`);

		const output = this.generateString();
		writeFileSync(this.options.output, output, "utf-8");

		// biome-ignore lint/suspicious/noConsole: CLI output
		console.log(`✓ Successfully generated ${this.options.output}`);
	}

	/**
	 * Generate the complete output as a string (without writing to file)
	 * @returns The generated TypeScript code including schemas, client, and service
	 */
	generateString(): string {
		// Ensure spec is parsed
		if (!this.spec) {
			this.spec = this.parseSpec();
		}

		const schemasString = this.generateSchemasString();
		const clientString = this.generateClientString();
		const serviceString = this.generateServiceString();

		// Add Playwright imports at the top
		const playwrightImports = `import type { APIRequestContext, APIResponse } from "@playwright/test";\nimport { expect } from "@playwright/test";\n\n`;

		// Find where to insert imports (after existing imports)
		let output = schemasString;
		const importRegex = /^import\s+.*?;$/gm;
		const matches = [...output.matchAll(importRegex)];

		if (matches.length > 0) {
			const lastImport = matches[matches.length - 1];
			if (lastImport.index !== undefined) {
				const insertPos = lastImport.index + lastImport[0].length + 1;
				output = output.slice(0, insertPos) + playwrightImports + output.slice(insertPos);
			}
		} else {
			// No imports found, add at the beginning
			output = playwrightImports + output;
		}

		// Append classes at the end
		output += `\n${clientString}`;
		output += `\n${serviceString}`;

		return output;
	}

	/**
	 * Generate Zod schemas as a string
	 * @returns The generated Zod schemas TypeScript code
	 */
	generateSchemasString(): string {
		// Ensure spec is parsed
		if (!this.spec) {
			this.spec = this.parseSpec();
		}

		const schemaGenerator = new ZodSchemaGenerator(this.options);
		return schemaGenerator.generateString();
	}

	/**
	 * Generate the ApiClient class as a string
	 * @returns The generated ApiClient class TypeScript code
	 */
	generateClientString(): string {
		// Ensure spec is parsed
		if (!this.spec) {
			this.spec = this.parseSpec();
		}

		return generateClientClass(this.spec);
	}

	/**
	 * Generate the ApiService class as a string
	 * @returns The generated ApiService class TypeScript code
	 */
	generateServiceString(): string {
		// Ensure spec is parsed
		if (!this.spec) {
			this.spec = this.parseSpec();
		}

		const schemaImports = new Set<string>();
		return generateServiceClass(this.spec, schemaImports);
	}

	/**
	 * Parse the OpenAPI specification file
	 */
	private parseSpec(): OpenAPISpec {
		try {
			const content = readFileSync(this.options.input, "utf-8");

			// Try parsing as YAML first (works for both YAML and JSON)
			try {
				return parse(content) as OpenAPISpec;
			} catch {
				// If YAML parsing fails, try JSON
				return JSON.parse(content) as OpenAPISpec;
			}
		} catch (error) {
			throw new Error(
				`Failed to parse OpenAPI specification at ${this.options.input}: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}
