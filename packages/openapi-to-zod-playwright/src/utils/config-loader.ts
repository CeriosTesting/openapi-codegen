import {
	BaseDefaultsSchema,
	BaseGeneratorOptionsSchema,
	mergeCliWithConfig as coreMergeCliWithConfig,
	createConfigLoader,
	ExecutionModeSchema,
	type FormatZodErrorsOptions,
	OperationFiltersSchema,
	RegexPatternSchema,
	RequestResponseOptionsSchema,
} from "@cerios/openapi-core";
import { z } from "zod";
import type { OpenApiPlaywrightGeneratorOptions, PlaywrightConfigFile } from "../types";

/**
 * Playwright operation filters schema - extends base with status code filtering
 */
const PlaywrightOperationFiltersSchema = OperationFiltersSchema.extend({
	includeStatusCodes: z.array(z.string()).optional(),
	excludeStatusCodes: z.array(z.string()).optional(),
});

/**
 * Zod error format schema for Playwright-specific formatting
 */
const ZodErrorFormatSchema = z.enum(["standard", "prettify", "prettifyWithValues"]);

/**
 * Playwright-specific options schema (beyond base options)
 * Note: schemaType is not included - always "all" for Playwright
 */
const PlaywrightSpecificOptionsSchema = z.strictObject({
	mode: z.enum(["strict", "normal", "loose"]).optional(),
	outputClient: z.string(),
	outputService: z.string().optional(),
	validateServiceRequest: z.boolean().optional(),
	ignoreHeaders: z.array(z.string()).optional(),
	useDescribe: z.boolean().optional(),
	emptyObjectBehavior: z.enum(["strict", "loose", "record"]).optional(),
	request: RequestResponseOptionsSchema.optional(),
	response: RequestResponseOptionsSchema.optional(),
	basePath: z.string().optional(),
	operationFilters: PlaywrightOperationFiltersSchema.optional(),
	useOperationId: z.boolean().optional(),
	fallbackContentTypeParsing: z.enum(["text", "json", "body"]).optional(),
	zodErrorFormat: ZodErrorFormatSchema.optional(),
	customDateTimeFormatRegex: z.union([RegexPatternSchema, z.instanceof(RegExp)]).optional(),
});

/**
 * Full Playwright generator options schema - base + Playwright-specific
 * Uses .extend() instead of deprecated .merge() for Zod v4 compatibility
 */
const OpenApiPlaywrightGeneratorOptionsSchema = BaseGeneratorOptionsSchema.omit({
	operationFilters: true, // Use Playwright-specific version
}).extend({
	...PlaywrightSpecificOptionsSchema.shape,
	outputTypes: z.string(), // Make outputTypes required for Playwright generator
});

/**
 * Playwright defaults schema - base defaults + Playwright-specific options
 * Adds generateService which is a defaults-only option
 * Uses .extend() instead of deprecated .merge() for Zod v4 compatibility
 */
const PlaywrightDefaultsSchema = BaseDefaultsSchema.omit({ operationFilters: true }).extend({
	...PlaywrightSpecificOptionsSchema.omit({ outputClient: true }).shape,
	generateService: z.boolean().optional(),
	outputClient: z.string().optional(), // Optional in defaults
});

/**
 * Playwright config file schema
 */
const PlaywrightConfigFileSchema = z.strictObject({
	defaults: PlaywrightDefaultsSchema.optional(),
	specs: z.array(OpenApiPlaywrightGeneratorOptionsSchema).min(1, {
		message:
			"Configuration must include at least one specification. Each specification should have 'input', 'outputTypes', and 'outputClient' paths.",
	}),
	executionMode: ExecutionModeSchema.optional(),
});

// Custom error messages for user-friendly validation errors
const errorMessages: FormatZodErrorsOptions = {
	missingFieldMessages: {
		input: "Each spec must specify the path to your OpenAPI specification file.",
		outputTypes: "Each spec must specify an output file path for generated Zod schemas.",
		outputClient: "Each spec must specify an output file path for the generated Playwright API client.",
	},
	unrecognizedKeyMessages: {
		output: "Did you mean 'outputTypes' or 'outputClient'? The 'output' field was renamed.",
	},
	requiredFieldsHelp: "All required fields are present (specs array with input/outputTypes/outputClient)",
};

// Create config loader using factory from core
const configLoader = createConfigLoader<PlaywrightConfigFile>(
	{
		packageName: "openapi-to-zod-playwright",
		errorMessages,
	},
	PlaywrightConfigFileSchema
);

/**
 * Load and validate Playwright configuration file
 * Supports: openapi-to-zod-playwright.config.{ts,json}, package.json under "openapi-to-zod-playwright" key
 *
 * @param configPath - Optional explicit path to config file. If not provided, searches automatically
 * @returns Validated PlaywrightConfigFile object with schemaType enforced to "all"
 * @throws Error if config file not found, invalid, or contains unknown properties
 */
export const loadConfig = configLoader.loadConfig;

/**
 * Merge global defaults with per-spec configuration
 * CLI arguments have highest precedence and are merged separately in CLI layer
 * Automatically enforces schemaType: "all" for all specs
 *
 * @param config - Validated Playwright configuration file
 * @returns Array of fully resolved OpenApiPlaywrightGeneratorOptions objects with schemaType enforced to "all"
 */
export function mergeConfigWithDefaults(config: PlaywrightConfigFile): OpenApiPlaywrightGeneratorOptions[] {
	if (!config?.specs || !Array.isArray(config.specs)) {
		throw new Error("Invalid config: specs array is required");
	}

	const defaults = config.defaults || {};

	return config.specs.map(spec => {
		// Deep merge: spec options override defaults
		const merged: OpenApiPlaywrightGeneratorOptions = {
			// Apply defaults first
			mode: defaults.mode,
			includeDescriptions: defaults.includeDescriptions,
			useDescribe: defaults.useDescribe,
			defaultNullable: defaults.defaultNullable,
			emptyObjectBehavior: defaults.emptyObjectBehavior,
			prefix: defaults.prefix,
			suffix: defaults.suffix,
			showStats: defaults.showStats,
			validateServiceRequest: defaults.validateServiceRequest,
			ignoreHeaders: defaults.ignoreHeaders,
			customDateTimeFormatRegex: defaults.customDateTimeFormatRegex,
			preferredContentTypes: defaults.preferredContentTypes,
			fallbackContentTypeParsing: defaults.fallbackContentTypeParsing,
			zodErrorFormat: defaults.zodErrorFormat,
			// outputClient and outputService are intentionally NOT inherited from defaults
			// Each spec should define its own file paths

			// Override with spec-specific values (including required input)
			...spec,
		};
		return merged;
	});
}

/**
 * Merge CLI options with config options
 * CLI options have highest precedence and override both spec and default config
 * schemaType is always "all" for Playwright (cannot be overridden)
 *
 * @param specConfig - Configuration from config file (with defaults already applied)
 * @param cliOptions - Options provided via CLI arguments
 * @returns Merged OpenApiPlaywrightGeneratorOptions with CLI taking precedence and schemaType enforced
 */
export function mergeCliWithConfig(
	specConfig: OpenApiPlaywrightGeneratorOptions,
	cliOptions: Partial<OpenApiPlaywrightGeneratorOptions>
): OpenApiPlaywrightGeneratorOptions {
	// CLI options override everything, but schemaType is always "all"
	const merged = coreMergeCliWithConfig(specConfig, cliOptions);
	return {
		...merged,
		schemaType: "all", // Always enforce for Playwright
	} as OpenApiPlaywrightGeneratorOptions;
}
