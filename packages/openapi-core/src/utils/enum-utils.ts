/**
 * Enum utilities for generating unique enum member names
 *
 * Handles conversion of enum values to valid TypeScript enum member names
 * with special handling for sort option prefixes (-/+) and duplicate detection.
 */

/**
 * Convert a string value to a valid enum member name with deduplication support.
 *
 * Features:
 * - Converts values to PascalCase
 * - Handles `-` prefix by appending `Desc` suffix (for descending sort options)
 * - Handles `+` prefix by appending `Asc` suffix (for ascending sort options)
 * - Tracks used keys via optional Set to prevent duplicates
 * - Appends numeric suffix (2, 3, etc.) for remaining collisions
 *
 * @param value - The enum value to convert
 * @param usedKeys - Optional Set to track used keys and prevent duplicates
 * @returns A valid, unique enum member name
 *
 * @example
 * ```typescript
 * const usedKeys = new Set<string>();
 * stringToEnumMember("externalKey", usedKeys); // "ExternalKey"
 * stringToEnumMember("-externalKey", usedKeys); // "ExternalKeyDesc"
 * stringToEnumMember("+externalKey", usedKeys); // "ExternalKeyAsc"
 * stringToEnumMember("foo_bar", usedKeys); // "FooBar"
 * stringToEnumMember("foo-bar", usedKeys); // "FooBar2" (collision with foo_bar)
 * ```
 */
export function stringToEnumMember(value: string, usedKeys?: Set<string>): string {
	// Handle empty string
	if (!value) {
		return registerKey("Empty", usedKeys);
	}

	// Check for sort order prefixes
	let suffix = "";
	let processValue = value;

	if (value.startsWith("-")) {
		suffix = "Desc";
		processValue = value.slice(1);
	} else if (value.startsWith("+")) {
		suffix = "Asc";
		processValue = value.slice(1);
	}

	// Handle case where value is just "-" or "+"
	if (!processValue) {
		return registerKey(suffix || "Empty", usedKeys);
	}

	// Convert to PascalCase, handling special characters
	let result = processValue
		// Replace non-alphanumeric with space
		.replace(/[^a-zA-Z0-9]/g, " ")
		// Split and capitalize each word
		.split(/\s+/)
		.filter(Boolean)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join("");

	// Ensure it starts with a letter
	if (/^[0-9]/.test(result)) {
		result = `Value${result}`;
	}

	// Handle empty result (value was only special chars)
	if (!result) {
		result = "Value";
	}

	// Append sort suffix if present
	result = result + suffix;

	return registerKey(result, usedKeys);
}

/**
 * Convert a numeric value to a valid enum member name with deduplication support.
 *
 * Features:
 * - Converts numbers to `Value{n}` format
 * - Handles negative numbers with `Neg` prefix: `-5` → `ValueNeg5`
 * - Handles `+` prefixed strings by appending `Asc` suffix: `+5` → `Value5Asc`
 * - Handles `-` prefixed strings by appending `Desc` suffix: `-5` (string) → `Value5Desc`
 * - Tracks used keys via optional Set to prevent duplicates
 *
 * @param value - The numeric value or string representation to convert
 * @param usedKeys - Optional Set to track used keys and prevent duplicates
 * @returns A valid, unique enum member name
 *
 * @example
 * ```typescript
 * const usedKeys = new Set<string>();
 * numericToEnumMember(5, usedKeys); // "Value5"
 * numericToEnumMember(-5, usedKeys); // "ValueNeg5"
 * numericToEnumMember("+5", usedKeys); // "Value5Asc"
 * numericToEnumMember("-5", usedKeys); // "Value5Desc" (string form)
 * ```
 */
export function numericToEnumMember(value: number | string, usedKeys?: Set<string>): string {
	if (typeof value === "number") {
		const memberName = `Value${value < 0 ? `Neg${Math.abs(value)}` : value}`;
		return registerKey(memberName, usedKeys);
	}

	// Handle string representation with +/- prefix
	const strValue = String(value);

	if (strValue.startsWith("+")) {
		const num = strValue.slice(1);
		return registerKey(`Value${num}Asc`, usedKeys);
	}

	if (strValue.startsWith("-")) {
		const num = strValue.slice(1);
		return registerKey(`Value${num}Desc`, usedKeys);
	}

	return registerKey(`Value${strValue}`, usedKeys);
}

/**
 * Register a key and ensure uniqueness by appending numeric suffix if needed.
 *
 * @param key - The base key to register
 * @param usedKeys - Optional Set to track used keys
 * @returns The unique key (possibly with numeric suffix)
 */
function registerKey(key: string, usedKeys?: Set<string>): string {
	if (!usedKeys) {
		return key;
	}

	let uniqueKey = key;
	let counter = 2;

	while (usedKeys.has(uniqueKey)) {
		uniqueKey = `${key}${counter}`;
		counter++;
	}

	usedKeys.add(uniqueKey);
	return uniqueKey;
}
