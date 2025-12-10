#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { z } from "zod";
import { CliOptionsError } from "./errors";
import { PlaywrightGenerator } from "./playwright-generator";
import { type PlaywrightGeneratorOptions } from "./types";
import { loadConfig, mergeCliWithConfig, mergeConfigWithDefaults } from "./utils/config-loader";

/**
 * Zod schema for CLI options validation
 * Ensures all options are valid before passing to generator
 * Note: input and output are now optional to support config file mode
 */
const CliOptionsSchema = z.object({
	input: z.string().min(1, "Input path cannot be empty").optional(),
	output: z.string().min(1, "Output path cannot be empty").optional(),
	outputClient: z.string().optional(),
	outputService: z.string().optional(),
	generateService: z.boolean().default(true),
	validateServiceRequest: z.boolean().default(false),
	mode: z.enum(["strict", "normal", "loose"]).default("normal"),
	requestTypeMode: z.enum(["inferred", "native"]).optional(),
	enumType: z.enum(["zod", "typescript"]).default("zod"),
	nativeEnumType: z.enum(["union", "enum"]).default("union"),
	descriptions: z.boolean().default(true),
	useDescribe: z.boolean().default(false),
	stats: z.boolean().default(true),
	prefix: z.string().optional(),
	suffix: z.string().optional(),
	config: z.string().optional(),
});

/**
 * Validate CLI options using Zod schema
 * @throws CliOptionsError if validation fails
 */
function validateCliOptions(options: unknown): Partial<PlaywrightGeneratorOptions> & { config?: string } {
	try {
		const validated = CliOptionsSchema.parse(options);
		const result: Partial<PlaywrightGeneratorOptions> & { config?: string } = {
			generateService: validated.generateService,
			validateServiceRequest: validated.validateServiceRequest,
			mode: validated.mode,
			enumType: validated.enumType,
			nativeEnumType: validated.nativeEnumType,
			includeDescriptions: validated.descriptions,
			useDescribe: validated.useDescribe,
			showStats: validated.stats,
			config: validated.config,
		};

		if (validated.input) result.input = validated.input;
		if (validated.output) result.output = validated.output;
		if (validated.outputClient) result.outputClient = validated.outputClient;
		if (validated.outputService) result.outputService = validated.outputService;
		if (validated.prefix) result.prefix = validated.prefix;
		if (validated.suffix) result.suffix = validated.suffix;
		if (validated.requestTypeMode) {
			result.request = {
				typeMode: validated.requestTypeMode,
			};
		}

		return result;
	} catch (error) {
		if (error instanceof z.ZodError) {
			const formattedErrors = error.issues.map(err => `  - ${err.path.join(".")}: ${err.message}`).join("\n");
			throw new CliOptionsError(
				`Invalid CLI options:\n${formattedErrors}\n\nPlease check your command line arguments.`,
				error
			);
		}
		throw error;
	}
}

const program = new Command();

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

program
	.name("openapi-to-zod-playwright")
	.description("Generate Playwright API clients from OpenAPI specifications")
	.version(packageJson.version);

program
	.option("-c, --config <path>", "Path to configuration file (openapi-to-zod-playwright.config.{ts,json})")
	.option("-i, --input <path>", "Input OpenAPI specification file (YAML or JSON)")
	.option("-o, --output <path>", "Output file path for generated code")
	.option("--output-client <path>", "Optional output file path for client class (separate file)")
	.option("--output-service <path>", "Optional output file path for service class (separate file)")
	.option("--no-generate-service", "Disable service class generation (only generate client)")
	.option("--validate-service-request", "Enable Zod validation for service method request bodies")
	.option("-m, --mode <mode>", "Validation mode: strict, normal, or loose", "normal")
	.option("--request-type-mode <mode>", "Request type mode: inferred or native (responses always inferred)")
	.option("--enum-type <type>", "Enum type: zod or typescript", "zod")
	.option("--native-enum-type <type>", "Native enum type: union or enum", "union")
	.option("--no-descriptions", "Exclude JSDoc descriptions from generated code")
	.option("--use-describe", "Add .describe() calls for runtime descriptions")
	.option("--no-stats", "Hide generation statistics")
	.option("-p, --prefix <prefix>", "Prefix for schema names")
	.option("--suffix <suffix>", "Suffix for schema names")
	.action(async options => {
		try {
			// Validate CLI options with Zod
			const cliOptions = validateCliOptions(options);

			// If config file is specified or found, use config-based generation
			if (cliOptions.config || (!cliOptions.input && !cliOptions.output)) {
				const config = await loadConfig(cliOptions.config);
				const specs = mergeConfigWithDefaults(config);

				// Merge CLI options with each spec from config
				for (const spec of specs) {
					const mergedOptions = mergeCliWithConfig(spec, cliOptions);
					const generator = new PlaywrightGenerator(mergedOptions);
					generator.generate();
				}
			} else {
				// Direct CLI mode - input and output are required
				if (!cliOptions.input || !cliOptions.output) {
					throw new CliOptionsError(
						"Either use a config file (-c/--config) or provide both -i/--input and -o/--output options."
					);
				}

				const generatorOptions: PlaywrightGeneratorOptions = {
					input: cliOptions.input,
					output: cliOptions.output,
					...cliOptions,
				};

				const generator = new PlaywrightGenerator(generatorOptions);
				generator.generate();
			}
		} catch (error) {
			console.error("Error:", error instanceof Error ? error.message : String(error));
			process.exit(1);
		}
	});

program.parse();
