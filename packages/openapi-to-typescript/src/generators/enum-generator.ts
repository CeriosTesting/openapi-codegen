/**
 * Enum generator for TypeScript types
 *
 * Generates TypeScript enums, union types, or const objects from OpenAPI enum schemas
 */

import { applyFormatting, classifyEnumType, numericToEnumMember, stringToEnumMember } from "@cerios/openapi-core";
import type { EnumFormat } from "../types";

export interface EnumGeneratorOptions {
	format: EnumFormat;
	prefix?: string;
	suffix?: string;
}

export interface EnumGeneratorResult {
	code: string;
	typeName: string;
}

/**
 * Generate TypeScript code for an enum schema
 */
export function generateEnum(
	name: string,
	values: (string | number | boolean)[],
	options: EnumGeneratorOptions
): EnumGeneratorResult {
	const { format, prefix, suffix } = options;
	const typeName = applyFormatting(name, prefix, suffix);

	switch (format) {
		case "enum":
			return generateTsEnum(typeName, values);
		case "union":
			return generateUnion(typeName, values);
		case "const-object":
			return generateConstObject(typeName, values);
		default:
			return generateUnion(typeName, values);
	}
}

/**
 * Generate a TypeScript enum
 */
function generateTsEnum(typeName: string, values: (string | number | boolean)[]): EnumGeneratorResult {
	const enumType = classifyEnumType(values);

	// For boolean enums, we can't use TS enum - fall back to union
	if (enumType === "boolean") {
		return generateUnion(typeName, values);
	}

	// Track used keys to prevent duplicates
	const usedKeys = new Set<string>();

	const members = values.map(value => {
		if (typeof value === "string") {
			// Convert value to valid enum member name with deduplication
			const memberName = stringToEnumMember(value, usedKeys);
			return `  ${memberName} = "${value}"`;
		}
		if (typeof value === "number") {
			const memberName = numericToEnumMember(value, usedKeys);
			return `  ${memberName} = ${value}`;
		}
		// Booleans handled above
		return `  ${String(value)} = ${value}`;
	});

	const code = `export enum ${typeName} {\n${members.join(",\n")},\n}`;
	return { code, typeName };
}

/**
 * Generate a TypeScript union type
 */
function generateUnion(typeName: string, values: (string | number | boolean)[]): EnumGeneratorResult {
	const literals = values.map(value => {
		if (typeof value === "string") {
			return `"${value}"`;
		}
		if (typeof value === "boolean") {
			return String(value);
		}
		return String(value);
	});

	const code = `export type ${typeName} = ${literals.join(" | ")};`;
	return { code, typeName };
}

/**
 * Generate a const object with derived type
 */
function generateConstObject(typeName: string, values: (string | number | boolean)[]): EnumGeneratorResult {
	const enumType = classifyEnumType(values);

	// For boolean enums, fall back to union
	if (enumType === "boolean") {
		return generateUnion(typeName, values);
	}

	// Track used keys to prevent duplicates
	const usedKeys = new Set<string>();

	const members = values.map(value => {
		if (typeof value === "string") {
			const memberName = stringToEnumMember(value, usedKeys);
			return `  ${memberName}: "${value}"`;
		}
		if (typeof value === "number") {
			const memberName = numericToEnumMember(value, usedKeys);
			return `  ${memberName}: ${value}`;
		}
		return `  ${String(value)}: ${value}`;
	});

	const objectCode = `export const ${typeName} = {\n${members.join(",\n")},\n} as const;`;
	const typeCode = `export type ${typeName} = (typeof ${typeName})[keyof typeof ${typeName}];`;
	const code = `${objectCode}\n${typeCode}`;

	return { code, typeName };
}
