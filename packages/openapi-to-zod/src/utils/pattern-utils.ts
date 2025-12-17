/**
 * Pattern matching utilities for prefix stripping
 *
 * Shared utility used by core and playwright packages
 *
 * Supports both literal string matching and regex patterns for stripping
 * prefixes from strings (paths, schema names, etc.)
 */

/**
 * Detects if a string pattern should be treated as a regex
 * Checks for common regex indicators:
 * - Starts with ^ (anchor) or ends with $ (anchor)
 * - Contains \d, \w, \s (character classes)
 * - Contains .* or .+ (quantifiers)
 * - Contains [], (), {} (groups/classes)
 */
function isRegexPattern(pattern: string): boolean {
	// Check for regex anchors
	if (pattern.startsWith("^") || pattern.endsWith("$")) {
		return true;
	}

	// Check for escaped character classes
	if (/\\[dDwWsS]/.test(pattern)) {
		return true;
	}

	// Check for quantifiers and wildcards
	if (/\.\*|\.\+/.test(pattern)) {
		return true;
	}

	// Check for character classes and groups
	if (/[[\]()]/.test(pattern)) {
		return true;
	}

	// Check for quantifiers in regex context
	if (/[^/][+?*]\{/.test(pattern)) {
		return true;
	}

	return false;
}

/**
 * Converts a string pattern to a RegExp if it looks like a regex
 * Otherwise treats it as a literal string prefix
 * @param pattern - The pattern (string or RegExp)
 * @returns A RegExp object or null for literal string matching
 */
function patternToRegex(pattern: string | RegExp): RegExp | null {
	if (pattern instanceof RegExp) {
		return pattern;
	}

	if (isRegexPattern(pattern)) {
		try {
			return new RegExp(pattern);
		} catch (error) {
			console.warn(`⚠️  Invalid regex pattern "${pattern}": ${error instanceof Error ? error.message : String(error)}`);
			return null;
		}
	}

	// Literal string - return null to indicate literal matching
	return null;
}

/**
 * @shared Strips a prefix from a string using either literal string matching or regex
 * @since 1.1.0
 * Shared utility used by core and playwright packages
 *
 * @param input - The full string to strip from
 * @param pattern - The pattern to strip (string or RegExp)
 * @param ensureLeadingChar - Optional character to ensure at start (e.g., "/" for paths)
 * @returns The string with prefix removed, or original string if no match
 *
 * @example
 * // Literal string matching
 * stripPrefix("/api/v1/users", "/api/v1") // => "/users"
 * stripPrefix("Company.Models.User", "Company.Models.") // => "User"
 *
 * @example
 * // Regex pattern matching
 * stripPrefix("/api/v1.0/users", "^/api/v\\d+\\.\\d+") // => "/users"
 * stripPrefix("api_v2_UserSchema", "^api_v\\d+_") // => "UserSchema"
 */
export function stripPrefix(input: string, pattern: string | RegExp | undefined, ensureLeadingChar?: string): string {
	if (!pattern) {
		return input;
	}

	const regex = patternToRegex(pattern);

	if (regex) {
		// Regex matching
		const match = input.match(regex);
		if (match && match.index === 0) {
			// Remove the matched prefix
			const stripped = input.substring(match[0].length);

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
	} else {
		// Literal string matching
		const stringPattern = pattern as string;

		// For exact matching, use the pattern as-is
		if (input.startsWith(stringPattern)) {
			const stripped = input.substring(stringPattern.length);

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
	}

	// No match - return original input
	return input;
}

/**
 * @shared Strips a prefix from a path (ensures leading slash)
 * @since 1.1.0
 * Shared utility used by playwright package for path manipulation
 *
 * @param path - The full path to strip from
 * @param pattern - The pattern to strip (string or RegExp)
 * @returns The path with prefix removed, or original path if no match
 *
 * @example
 * stripPathPrefix("/api/v1/users", "/api/v1") // => "/users"
 * stripPathPrefix("/api/v2/posts", "^/api/v\\d+") // => "/posts"
 */
export function stripPathPrefix(path: string, pattern: string | RegExp | undefined): string {
	if (!pattern) {
		return path;
	}

	const regex = patternToRegex(pattern);

	if (!regex) {
		// For literal string matching with paths, normalize the pattern
		let normalizedPattern = (pattern as string).trim();
		if (!normalizedPattern.startsWith("/")) {
			normalizedPattern = `/${normalizedPattern}`;
		}
		if (normalizedPattern.endsWith("/") && normalizedPattern !== "/") {
			normalizedPattern = normalizedPattern.slice(0, -1);
		}

		return stripPrefix(path, normalizedPattern, "/");
	}

	return stripPrefix(path, regex, "/");
}
