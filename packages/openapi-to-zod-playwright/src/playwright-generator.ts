import { existsSync, readFileSync, writeFileSync } from "node:fs";
import type { OpenAPISpec } from "@cerios/openapi-to-zod";
import { ZodSchemaGenerator } from "@cerios/openapi-to-zod";
import { parse } from "yaml";
import { ClientGenerationError, FileOperationError, SpecValidationError } from "./errors";
import { generateClientClass } from "./generators/client-generator";
import { generateServiceClass } from "./generators/service-generator";
import type { PlaywrightGeneratorOptions } from "./types";

/**
 * Simple LRU cache implementation for performance optimization
 */
class LRUCache<K, V> {
	private cache = new Map<K, V>();
	private maxSize: number;

	constructor(maxSize: number) {
		this.maxSize = maxSize;
	}

	get(key: K): V | undefined {
		if (!this.cache.has(key)) return undefined;
		// Move to end (most recently used)
		const value = this.cache.get(key);
		if (value === undefined) return undefined;
		this.cache.delete(key);
		this.cache.set(key, value);
		return value;
	}

	set(key: K, value: V): void {
		if (this.cache.has(key)) {
			this.cache.delete(key);
		}
		this.cache.set(key, value);
		// Evict oldest if over limit
		if (this.cache.size > this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}
	}
}

/**
 * Main generator class for Playwright API clients
 * Generates Zod schemas, then appends client and service classes
 */
export class PlaywrightGenerator {
	private options: PlaywrightGeneratorOptions & { schemaType: "all" };
	private spec: OpenAPISpec | null = null;
	private static specCache = new LRUCache<string, OpenAPISpec>(50); // Cache for parsed specs

	constructor(options: PlaywrightGeneratorOptions) {
		// Input validation
		if (!options.input) {
			throw new FileOperationError("Input path is required", "");
		}

		if (!existsSync(options.input)) {
			throw new FileOperationError(`Input file not found: ${options.input}`, options.input);
		}

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
			throw new FileOperationError(
				"Output path is required when calling generate(). " +
					"Either provide an 'output' option or use generateString() to get the result as a string.",
				""
			);
		}

		console.log(`Generating Playwright client for ${this.options.input}...`);

		try {
			const output = this.generateString();
			writeFileSync(this.options.output, output, "utf-8");

			console.log(`✓ Successfully generated ${this.options.output}`);
		} catch (error) {
			throw new ClientGenerationError(
				`Failed to generate Playwright client: ${error instanceof Error ? error.message : String(error)}`,
				error instanceof Error ? error : undefined
			);
		}
	}

	/**
	 * Generate the complete output as a string (without writing to file)
	 * @returns The generated TypeScript code including schemas, client, and service
	 */
	generateString(): string {
		try {
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
		} finally {
			// Memory optimization: Clear spec after generation for large specs
			if (this.spec && JSON.stringify(this.spec).length > 100000) {
				this.spec = null;
			}
		}
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
	 * Parse the OpenAPI specification file with caching
	 * Enhanced with error context for better debugging
	 */
	private parseSpec(): OpenAPISpec {
		// Check cache first for performance
		const cached = PlaywrightGenerator.specCache.get(this.options.input);
		if (cached) {
			return cached;
		}

		const errorContext = { inputPath: this.options.input };

		try {
			const content = readFileSync(this.options.input, "utf-8");
			const fileSize = content.length;
			Object.assign(errorContext, { fileSize: `${(fileSize / 1024).toFixed(2)} KB` });

			// Try parsing as YAML first (works for both YAML and JSON)
			let spec: OpenAPISpec;
			try {
				spec = parse(content) as OpenAPISpec;
			} catch (yamlError) {
				// If YAML parsing fails, try JSON
				try {
					spec = JSON.parse(content) as OpenAPISpec;
				} catch {
					const errorMessage = [
						`Failed to parse OpenAPI specification from: ${this.options.input}`,
						`File size: ${errorContext.fileSize}`,
						`Error: ${yamlError instanceof Error ? yamlError.message : String(yamlError)}`,
						"",
						"Please ensure:",
						"  - The file exists and is readable",
						"  - The file contains valid YAML or JSON syntax",
						"  - The file is a valid OpenAPI 3.x specification",
					].join("\n");

					throw new SpecValidationError(
						errorMessage,
						this.options.input,
						yamlError instanceof Error ? yamlError : undefined
					);
				}
			}

			// Validate basic spec structure
			if (!spec.openapi && !spec.swagger) {
				throw new SpecValidationError(
					`Invalid OpenAPI specification: Missing 'openapi' or 'swagger' version field\n` +
						`File: ${this.options.input}\n` +
						`Size: ${errorContext.fileSize}`,
					this.options.input
				);
			}

			// Cache the parsed spec for performance
			PlaywrightGenerator.specCache.set(this.options.input, spec);
			return spec;
		} catch (error) {
			if (error instanceof SpecValidationError) {
				throw error;
			}
			const errorMessage = [
				`Failed to read OpenAPI specification file: ${this.options.input}`,
				`Context: ${JSON.stringify(errorContext)}`,
				`Error: ${error instanceof Error ? error.message : String(error)}`,
			].join("\n");

			throw new FileOperationError(errorMessage, this.options.input, error instanceof Error ? error : undefined);
		}
	}
}
