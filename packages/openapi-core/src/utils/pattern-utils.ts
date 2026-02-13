import { minimatch } from "minimatch";

/**
 * Pattern matching utilities for prefix/suffix stripping
 *
 * Supports both literal string matching and glob patterns for stripping
 * prefixes from strings (paths, schema names, etc.)
 */

/**
 * Validates if a glob pattern is syntactically valid
 * @param pattern - The glob pattern to validate
 * @returns true if valid, false otherwise
 */
function isValidGlobPattern(pattern: string): boolean {
	try {
		// Try to create a minimatch instance to validate the pattern
		new minimatch.Minimatch(pattern);
		return true;
	} catch {
		return false;
	}
}

/**
 * Checks if a pattern contains glob special characters
 * @param pattern - The pattern to check
 * @returns true if pattern contains glob wildcards
 */
export function isGlobPattern(pattern: string): boolean {
	return /[*?[\]{}!]/.test(pattern);
}

/**
 * Strips a prefix from a string using either literal string matching or glob patterns
 *
 * @param input - The full string to strip from
 * @param pattern - The glob pattern to strip
 * @param ensureLeadingChar - Optional character to ensure at start (e.g., "/" for paths)
 * @returns The string with prefix removed, or original string if no match
 *
 * @example
 * // Literal string matching
 * stripPrefix("/api/v1/users", "/api/v1") // => "/users"
 * stripPrefix("Company.Models.User", "Company.Models.") // => "User"
 *
 * @example
 * // Glob pattern matching
 * stripPrefix("/api/v1.0/users", "/api/v*") // => matches and strips
 * stripPrefix("Company.Models.User", "*.Models.") // => "User"
 * stripPrefix("api_v2_UserSchema", "api_v[0-9]_") // => "UserSchema"
 */
export function stripPrefix(input: string, pattern: string | string[] | undefined, ensureLeadingChar?: string): string {
	if (!pattern) {
		return input;
	}

	// Handle array of patterns - try each one until a match is found
	if (Array.isArray(pattern)) {
		for (const p of pattern) {
			const result = stripPrefix(input, p, ensureLeadingChar);
			if (result !== input) {
				return result; // Found a match, return the stripped result
			}
		}
		return input; // No matches found
	}

	// Validate glob pattern if it contains special characters
	if (isGlobPattern(pattern) && !isValidGlobPattern(pattern)) {
		console.warn(`⚠️  Invalid glob pattern "${pattern}": Pattern is malformed`);
		return input;
	}

	// Check if pattern contains glob wildcards
	if (isGlobPattern(pattern)) {
		// Use glob matching to find the prefix
		// We need to find what part of the input matches the pattern as a prefix
		// Try matching progressively longer prefixes to find the longest match
		let longestMatch = -1;

		for (let i = 1; i <= input.length; i++) {
			const testPrefix = input.substring(0, i);
			if (minimatch(testPrefix, pattern)) {
				// Found a match - keep looking for a longer match
				longestMatch = i;
			}
		}

		if (longestMatch > 0) {
			// Strip the longest matching prefix
			const stripped = input.substring(longestMatch);

			// Ensure result starts with specified character if provided
			if (ensureLeadingChar) {
				if (stripped === "") {
					return ensureLeadingChar;
				}
				if (!stripped.startsWith(ensureLeadingChar)) {
					return `${ensureLeadingChar}${stripped}`;
				}
			}

			return stripped === "" && !ensureLeadingChar ? input : stripped;
		}

		// No match found
		return input;
	}

	// Literal string matching
	if (input.startsWith(pattern)) {
		const stripped = input.substring(pattern.length);

		// Ensure result starts with specified character if provided
		if (ensureLeadingChar) {
			if (stripped === "") {
				return ensureLeadingChar;
			}
			if (!stripped.startsWith(ensureLeadingChar)) {
				return `${ensureLeadingChar}${stripped}`;
			}
		}

		return stripped;
	}

	// No match - return original input
	return input;
}

/**
 * Strips a suffix from a string using literal string matching
 *
 * @param input - The full string to strip from
 * @param suffix - The suffix to strip
 * @returns The string with suffix removed, or original string if no match
 *
 * @example
 * stripSuffix("UserSchema", "Schema") // => "User"
 * stripSuffix("OrderResponse", "Response") // => "Order"
 */
export function stripSuffix(input: string, suffix: string | undefined): string {
	if (!suffix) {
		return input;
	}

	if (input.endsWith(suffix)) {
		return input.substring(0, input.length - suffix.length);
	}

	return input;
}

/**
 * Strips both prefix and suffix from a string
 *
 * @param input - The full string to strip from
 * @param prefix - The prefix to strip
 * @param suffix - The suffix to strip
 * @returns The string with both affixes removed
 *
 * @example
 * stripAffixes("ApiUserSchema", "Api", "Schema") // => "User"
 */
export function stripAffixes(input: string, prefix: string | undefined, suffix: string | undefined): string {
	let result = stripPrefix(input, prefix);
	result = stripSuffix(result, suffix);
	return result;
}

/**
 * Strips a prefix from a path (ensures leading slash)
 *
 * @param path - The full path to strip from
 * @param pattern - The glob pattern to strip
 * @returns The path with prefix removed, or original path if no match
 *
 * @example
 * stripPathPrefix("/api/v1/users", "/api/v1") // => "/users"
 * stripPathPrefix("/api/v2/posts", "/api/v*") // => "/posts"
 * stripPathPrefix("/api/v1.0/items", "/api/v[0-9].*") // => "/items"
 */
export function stripPathPrefix(path: string, pattern: string | undefined): string {
	if (!pattern) {
		return path;
	}

	// For literal string matching with paths, normalize the pattern
	if (!isGlobPattern(pattern)) {
		let normalizedPattern = pattern.trim();
		if (!normalizedPattern.startsWith("/")) {
			normalizedPattern = `/${normalizedPattern}`;
		}
		if (normalizedPattern.endsWith("/") && normalizedPattern !== "/") {
			normalizedPattern = normalizedPattern.slice(0, -1);
		}

		return stripPrefix(path, normalizedPattern, "/");
	}

	// For glob patterns, use as-is
	return stripPrefix(path, pattern, "/");
}
