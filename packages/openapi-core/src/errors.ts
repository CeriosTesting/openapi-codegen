/**
 * Custom error classes for OpenAPI processing
 */

/**
 * Base error class for all generator errors
 */
export class GeneratorError extends Error {
	constructor(
		message: string,
		public readonly code: string,
		public readonly context?: Record<string, unknown>
	) {
		super(message);
		this.name = "GeneratorError";
		Error.captureStackTrace?.(this, this.constructor);
	}
}

/**
 * Error thrown when OpenAPI spec validation fails
 */
export class SpecValidationError extends GeneratorError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "SPEC_VALIDATION_ERROR", context);
		this.name = "SpecValidationError";
	}
}

/**
 * Error thrown when file operations fail
 */
export class FileOperationError extends GeneratorError {
	constructor(
		message: string,
		public readonly filePath: string,
		context?: Record<string, unknown>
	) {
		super(message, "FILE_OPERATION_ERROR", { ...context, filePath });
		this.name = "FileOperationError";
	}
}

/**
 * Error thrown when config file is invalid
 */
export class ConfigValidationError extends GeneratorError {
	constructor(
		message: string,
		public readonly configPath?: string,
		context?: Record<string, unknown>
	) {
		super(message, "CONFIG_VALIDATION_ERROR", { ...context, configPath });
		this.name = "ConfigValidationError";
	}
}

/**
 * Error thrown when configuration is invalid or missing required values
 */
export class ConfigurationError extends GeneratorError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "CONFIGURATION_ERROR", context);
		this.name = "ConfigurationError";
	}
}

/**
 * Error thrown when CLI options are invalid
 */
export class CliOptionsError extends GeneratorError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "CLI_OPTIONS_ERROR", context);
		this.name = "CliOptionsError";
	}
}

/**
 * Error thrown when schema generation fails
 */
export class SchemaGenerationError extends GeneratorError {
	constructor(
		message: string,
		public readonly schemaName: string,
		context?: Record<string, unknown>
	) {
		super(message, "SCHEMA_GENERATION_ERROR", { ...context, schemaName });
		this.name = "SchemaGenerationError";
	}
}

/**
 * Error thrown when circular reference is detected in schema
 */
export class CircularReferenceError extends SchemaGenerationError {
	constructor(
		schemaName: string,
		public readonly referencePath: string[]
	) {
		const pathStr = referencePath.join(" -> ");
		super(`Circular reference detected in schema: ${pathStr}`, schemaName, { referencePath, circularPath: pathStr });
		this.name = "CircularReferenceError";
	}
}

/**
 * Error thrown when template rendering fails
 */
export class TemplateError extends GeneratorError {
	constructor(
		message: string,
		public readonly templateName?: string,
		context?: Record<string, unknown>
	) {
		super(message, "TEMPLATE_ERROR", { ...context, templateName });
		this.name = "TemplateError";
	}
}

/**
 * Error thrown when a required dependency is not installed
 */
export class MissingDependencyError extends GeneratorError {
	constructor(
		message: string,
		public readonly packageName: string
	) {
		super(message, "MISSING_DEPENDENCY_ERROR", { packageName });
		this.name = "MissingDependencyError";
	}
}
