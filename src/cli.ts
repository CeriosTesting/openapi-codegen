#!/usr/bin/env node
/** biome-ignore-all lint/suspicious/noConsole: Logging for the CLI tool */
import { Command } from "commander";
import { executeBatch, getBatchExitCode } from "./batch-executor";
import { ZodSchemaGenerator } from "./generator";
import type { ExecutionMode, GeneratorOptions } from "./types";
import { loadConfig, mergeCliWithConfig, mergeConfigWithDefaults } from "./utils/config-loader";

const program = new Command();

program
	.name("openapi-to-zod")
	.description("Generate Zod v4 schemas from OpenAPI specifications")
	.version("1.0.0")
	.option("-c, --config <path>", "Path to config file (openapi-to-zod.config.{ts,json})")
	.option("-i, --input <path>", "Input OpenAPI YAML file path (single-spec mode)")
	.option("-o, --output <path>", "Output TypeScript file path (single-spec mode)")
	.option("-m, --mode <mode>", "Validation mode: strict, normal, or loose", "normal")
	.option("--no-descriptions", "Exclude JSDoc descriptions from generated schemas")
	.option("-e, --enum-type <type>", "Enum type: zod or typescript", "zod")
	.option("--use-describe", "Add .describe() calls for better runtime error messages")
	.option("-s, --schema-type <type>", "Schema type: all, request, or response", "all")
	.option("-p, --prefix <prefix>", "Add prefix to all generated schema names")
	.option("--suffix <suffix>", "Add suffix before 'Schema' in generated names")
	.option("--no-stats", "Exclude generation statistics from output file")
	.option("--execution-mode <mode>", "Batch execution mode: parallel (default) or sequential")
	.action(async options => {
		try {
			// Check if config file mode or single-spec mode
			if (options.config || (!options.input && !options.output)) {
				// Config file mode (batch processing)
				await executeBatchMode(options);
			} else {
				// Single-spec mode (original behavior)
				await executeSingleSpecMode(options);
			}
		} catch (error) {
			console.error("Error:", error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

program.parse();

/**
 * Execute single-spec mode (original CLI behavior)
 */
async function executeSingleSpecMode(options: any): Promise<void> {
	if (!options.input || !options.output) {
		throw new Error("Both --input and --output are required in single-spec mode");
	}

	const generatorOptions: GeneratorOptions = {
		input: options.input,
		output: options.output,
		mode: options.mode as "strict" | "normal" | "loose",
		includeDescriptions: options.descriptions,
		enumType: options.enumType as "zod" | "typescript",
		useDescribe: options.useDescribe || false,
		schemaType: (options.schemaType as "all" | "request" | "response") || "all",
		prefix: options.prefix,
		suffix: options.suffix,
		showStats: options.stats ?? true,
	};

	const generator = new ZodSchemaGenerator(generatorOptions);
	generator.generate();
	console.log(`✓ Successfully generated schemas at ${options.output}`);
}

/**
 * Execute batch mode from config file
 */
async function executeBatchMode(options: any): Promise<void> {
	// Load config file
	const config = await loadConfig(options.config);

	// Merge defaults with specs
	let specs = mergeConfigWithDefaults(config);

	// Extract CLI options that can override config
	const cliOverrides: Partial<GeneratorOptions> = {};
	if (options.mode && options.mode !== "normal") cliOverrides.mode = options.mode;
	if (options.descriptions !== undefined) cliOverrides.includeDescriptions = options.descriptions;
	if (options.enumType && options.enumType !== "zod") cliOverrides.enumType = options.enumType;
	if (options.useDescribe) cliOverrides.useDescribe = true;
	if (options.schemaType && options.schemaType !== "all") cliOverrides.schemaType = options.schemaType;
	if (options.prefix) cliOverrides.prefix = options.prefix;
	if (options.suffix) cliOverrides.suffix = options.suffix;
	if (options.stats !== undefined) cliOverrides.showStats = options.stats;

	// Apply CLI overrides to all specs if any CLI options were provided
	if (Object.keys(cliOverrides).length > 0) {
		specs = specs.map(spec => mergeCliWithConfig(spec, cliOverrides));
	}

	// Determine execution mode
	const executionMode: ExecutionMode = (options.executionMode as ExecutionMode) || config.executionMode || "parallel";

	// Execute batch
	const summary = await executeBatch(specs, executionMode);

	// Exit with appropriate code
	const exitCode = getBatchExitCode(summary);
	if (exitCode !== 0) {
		process.exit(exitCode);
	}
}
