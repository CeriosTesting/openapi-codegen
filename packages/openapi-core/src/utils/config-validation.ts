import { z } from "zod";

/**
 * Custom error messages for specific field keys
 * Key is the field name, value is the custom error message
 */
export interface CustomFieldMessages {
	[fieldName: string]: string;
}

/**
 * Options for formatting Zod validation errors
 */
export interface FormatZodErrorsOptions {
	/**
	 * Custom error messages for specific fields when they are missing (undefined)
	 * @example { outputTypes: "Each spec must specify an output file path for generated types." }
	 */
	missingFieldMessages?: CustomFieldMessages;

	/**
	 * Custom error messages for unrecognized keys (typos, wrong field names)
	 * @example { output: "Did you mean 'outputTypes'? The 'output' field was renamed to 'outputTypes'." }
	 */
	unrecognizedKeyMessages?: CustomFieldMessages;

	/**
	 * Additional help notes to append to the error message
	 */
	additionalNotes?: string[];

	/**
	 * Package-specific help text for required fields
	 * @default "All required fields are present (specs array with input/outputTypes)"
	 */
	requiredFieldsHelp?: string;
}

/**
 * Format a single Zod issue into a user-friendly message
 */
function formatZodIssue(issue: z.ZodIssue, options: FormatZodErrorsOptions): string {
	const path = issue.path.length > 0 ? issue.path.join(".") : "root";
	const field = issue.path[issue.path.length - 1];
	const fieldStr = String(field);
	const issueAny = issue as unknown as Record<string, unknown>;

	// Handle missing required fields (undefined)
	if (issue.code === "invalid_type" && issueAny.received === "undefined") {
		const customMessage = options.missingFieldMessages?.[fieldStr];
		if (customMessage) {
			return `  - ${path}: Missing '${fieldStr}'. ${customMessage}`;
		}
		return `  - ${path}: Required field '${fieldStr}' is missing.`;
	}

	// Handle unrecognized keys (extra properties in strictObject)
	if (issue.code === "unrecognized_keys") {
		const messages: string[] = [];
		const keys = (issueAny.keys as string[]) || [];
		for (const key of keys) {
			const customMessage = options.unrecognizedKeyMessages?.[key];
			if (customMessage) {
				messages.push(`  - ${path}: Unrecognized key '${key}'. ${customMessage}`);
			} else {
				messages.push(`  - ${path}: Unrecognized key '${key}'. Check for typos in field names.`);
			}
		}
		return messages.join("\n");
	}

	// Handle invalid enum/value errors
	if (issue.code === "invalid_value" || (issueAny as { code?: string }).code === "invalid_enum_value") {
		const received = issueAny.received ?? issueAny.values ?? "unknown";
		const options_values = (issueAny.options as string[]) ?? (issueAny.values as string[]) ?? [];
		if (Array.isArray(options_values) && options_values.length > 0) {
			return `  - ${path}: Invalid value '${received}'. Expected one of: ${options_values.join(", ")}`;
		}
		return `  - ${path}: ${issue.message}`;
	}

	// Handle too_small (e.g., min array length)
	if (issue.code === "too_small") {
		return `  - ${path}: ${issue.message}`;
	}

	// Default: use Zod's message
	return `  - ${path}: ${issue.message}`;
}

/**
 * Format Zod validation errors into user-friendly error messages
 * with support for custom messages per field
 *
 * @param error - The Zod validation error
 * @param filepath - Path to the config file that was being validated
 * @param configPath - Optional explicit config path provided by user
 * @param options - Options for customizing error messages
 * @returns Formatted error message string
 */
export function formatConfigValidationError(
	error: z.ZodError,
	filepath: string | undefined,
	configPath: string | undefined,
	options: FormatZodErrorsOptions = {}
): string {
	const formattedErrors =
		error.issues?.map(issue => formatZodIssue(issue, options)).join("\n") || "Unknown validation error";

	const configSource = filepath || configPath || "config file";
	const requiredFieldsHelp =
		options.requiredFieldsHelp || "All required fields are present (specs array with input/outputTypes)";

	const lines = [
		`Invalid configuration file at: ${configSource}`,
		"",
		"Validation errors:",
		formattedErrors,
		"",
		"Please check your configuration file and ensure:",
		`  - ${requiredFieldsHelp}`,
		"  - Field names are spelled correctly (no typos)",
		"  - Values match the expected types (e.g., mode: 'strict' | 'normal' | 'loose')",
		"  - No unknown/extra properties are included",
	];

	if (options.additionalNotes && options.additionalNotes.length > 0) {
		lines.push(...options.additionalNotes.map(note => `  - ${note}`));
	}

	return lines.join("\n");
}
