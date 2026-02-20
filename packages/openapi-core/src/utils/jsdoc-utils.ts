/**
 * JSDoc generation utilities
 *
 * Shared utilities for generating JSDoc comments from OpenAPI operation metadata.
 * Standardizes on @summary/@description tag format.
 */

import { escapeJSDoc } from "./string-utils";

/**
 * Options for generating operation JSDoc
 */
export interface GenerateOperationJSDocOptions {
	/** Operation summary */
	summary?: string;
	/** Operation description */
	description?: string;
	/** Whether the operation is deprecated */
	deprecated?: boolean;
	/** HTTP method (e.g., "get", "GET") */
	method: string;
	/** API path (e.g., "/users/{id}") */
	path: string;
	/** Whether to include summary and description (default: true) */
	includeDescriptions?: boolean;
	/** Custom return type annotation */
	returns?: string;
	/** Additional JSDoc tags to include */
	additionalTags?: string[];
	/** Indentation string (default: "  " - two spaces) */
	indent?: string;
}

/**
 * Generates a JSDoc comment for an API operation
 *
 * Creates a formatted JSDoc block with summary, description, deprecated tag,
 * method annotation, and optional return type.
 *
 * @param options - JSDoc generation options
 * @returns Formatted JSDoc comment string
 *
 * @example
 * ```typescript
 * const jsdoc = generateOperationJSDoc({
 *   summary: "Get a user by ID",
 *   description: "Returns detailed user information",
 *   deprecated: false,
 *   method: "GET",
 *   path: "/users/{id}",
 *   returns: "K6ServiceResult with user data",
 * });
 *
 * // Output:
 * // /**
 * //  * @summary Get a user by ID
 * //  * @description Returns detailed user information
 * //  * @method GET /users/{id}
 * //  * @returns K6ServiceResult with user data
 * //  * /
 * ```
 */
export function generateOperationJSDoc(options: GenerateOperationJSDocOptions): string {
	const {
		summary,
		description,
		deprecated,
		method,
		path,
		includeDescriptions = true,
		returns,
		additionalTags = [],
		indent = "  ",
	} = options;

	const lines: string[] = ["/**"];

	// Add summary if present and includeDescriptions is true
	if (summary && includeDescriptions) {
		const sanitized = escapeJSDoc(summary);
		lines.push(` * @summary ${sanitized}`);
	}

	// Add description if present and includeDescriptions is true
	if (description && includeDescriptions) {
		const sanitized = escapeJSDoc(description);
		const descLines = sanitized.split("\n");
		lines.push(` * @description ${descLines[0]}`);
		for (let i = 1; i < descLines.length; i++) {
			lines.push(` * ${descLines[i]}`);
		}
	}

	// Add deprecated tag
	if (deprecated) {
		lines.push(" * @deprecated");
	}

	// Add method + path annotation
	lines.push(` * @method ${method.toUpperCase()} ${path}`);

	// Add returns annotation if provided
	if (returns) {
		lines.push(` * @returns ${returns}`);
	}

	// Add any additional tags
	for (const tag of additionalTags) {
		lines.push(` * ${tag}`);
	}

	lines.push(" */");

	return lines.join(`\n${indent}`);
}

/**
 * Options for generating minimal JSDoc (just summary/description without tags)
 */
export interface GenerateMinimalJSDocOptions {
	/** Operation summary */
	summary?: string;
	/** Operation description */
	description?: string;
	/** Whether the operation is deprecated */
	deprecated?: boolean;
	/** HTTP method */
	method: string;
	/** API path */
	path: string;
	/** Additional tags to include at the end */
	additionalTags?: string[];
	/** Indentation string (default: "\t" - tab) */
	indent?: string;
}

/**
 * Generates a minimal JSDoc comment (plain text format without @summary/@description tags)
 *
 * This is an alternative format that some generators may prefer.
 * Summary and description are rendered as plain text, not as @tags.
 *
 * @param options - JSDoc generation options
 * @returns Formatted JSDoc comment string
 */
export function generateMinimalJSDoc(options: GenerateMinimalJSDocOptions): string {
	const { summary, description, deprecated, method, path, additionalTags = [], indent = "\t" } = options;

	const lines: string[] = [];

	// Add summary as plain text
	if (summary) {
		lines.push(escapeJSDoc(summary));
	}

	// Add description as plain text
	if (description) {
		lines.push(escapeJSDoc(description));
	}

	// Add method + path
	lines.push(`${method.toUpperCase()} ${path}`);

	// Add deprecated tag
	if (deprecated) {
		lines.push("@deprecated");
	}

	// Add additional tags
	if (additionalTags.length > 0) {
		lines.push(...additionalTags);
	}

	// Format as JSDoc
	if (lines.length === 0) {
		return "";
	}

	const formattedLines = lines
		.map((line, index) => {
			if (index === 0) {
				return `${indent}/**\n${indent} * ${line}`;
			}
			if (line === "") {
				return `${indent} *`;
			}
			return `${indent} * ${line}`;
		})
		.join("\n");

	return `${formattedLines}\n${indent} */`;
}
