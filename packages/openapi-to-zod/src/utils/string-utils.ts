/**
 * Zod-specific string utility functions
 *
 * For core utilities (escapeDescription, etc.), import from @cerios/openapi-core
 */

import { escapeDescription } from "@cerios/openapi-core";

/**
 * Wrap validation with .nullable() if needed
 */
export function wrapNullable(validation: string, nullable: boolean): string {
	return nullable ? `${validation}.nullable()` : validation;
}

/**
 * Add description to a schema validation string
 */
export function addDescription(validation: string, description: string | undefined, useDescribe: boolean): string {
	if (!description || !useDescribe) return validation;

	const escapedDesc = escapeDescription(description);
	return `${validation}.describe("${escapedDesc}")`;
}
