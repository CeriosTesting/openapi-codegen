/**
 * @cerios/openapi-to-typescript
 *
 * Generate TypeScript types from OpenAPI specifications
 *
 * @example
 * ```typescript
 * import { TypeScriptGenerator, defineConfig } from '@cerios/openapi-to-typescript';
 *
 * // Using the generator directly
 * const generator = new TypeScriptGenerator({
 *   input: './openapi.yaml',
 *   output: './src/types.ts',
 *   enumFormat: 'union',
 * });
 * generator.generate();
 *
 * // Or generate to string
 * const types = generator.generateString();
 * ```
 */

// Batch execution (from core)
// Errors (from core)
export {
	type BatchExecutionSummary,
	CircularReferenceError,
	CliOptionsError,
	ConfigurationError,
	ConfigValidationError,
	executeBatch,
	FileOperationError,
	type Generator,
	GeneratorError,
	getBatchExitCode,
	SchemaGenerationError,
	SpecValidationError,
} from "@cerios/openapi-core";
// Generators
export {
	type EnumGeneratorOptions,
	type EnumGeneratorResult,
	formatTypeProperty,
	generateEnum,
	generateTypeDeclaration,
	type TypeGeneratorOptions,
	type TypeGeneratorResult,
} from "./generators";
// Types
export type {
	ConfigFile,
	DefaultOptions,
	EnumFormat,
	ExecutionMode,
	InternalTypeScriptGeneratorOptions,
	ResolvedOptions,
	SpecOptions,
	TypeScriptGeneratorOptions,
} from "./types";
export { defineConfig } from "./types";
// Main generator
export { TypeScriptGenerator } from "./typescript-generator";

// Config utilities
export {
	loadConfig,
	mergeCliWithConfig,
	mergeConfigWithDefaults,
	TypeScriptDefaultsSchema,
	TypeScriptGeneratorOptionsSchema,
	TypeScriptSpecificOptionsSchema,
} from "./utils/config-loader";
