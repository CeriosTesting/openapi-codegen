/**
 * Type generator for TypeScript types
 *
 * Generates TypeScript type aliases from OpenAPI object schemas
 */

import { applyFormatting } from "@cerios/openapi-core";

export interface TypeGeneratorOptions {
	prefix?: string;
	suffix?: string;
}

export interface TypeGeneratorResult {
	code: string;
	typeName: string;
}

/**
 * Generate a TypeScript type declaration
 */
export function generateTypeDeclaration(
	name: string,
	properties: string[],
	options: TypeGeneratorOptions
): TypeGeneratorResult {
	const { prefix, suffix } = options;
	const typeName = applyFormatting(name, prefix, suffix);

	const code = `export type ${typeName} = {\n  ${properties.join(";\n  ")};\n};`;
	return { code, typeName };
}

/**
 * Format a property for use in an interface or type
 */
export function formatTypeProperty(name: string, type: string, required: boolean): string {
	// Escape property names that need quotes
	const safeName = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name) ? name : `"${name}"`;
	const optional = required ? "" : "?";
	return `${safeName}${optional}: ${type}`;
}
