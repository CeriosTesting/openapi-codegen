/**
 * Path utilities for URL normalization and construction
 *
 * Shared utilities for handling API paths and base paths
 */

/**
 * Normalizes a base path by ensuring it has a leading slash and no trailing slash
 *
 * Returns undefined for empty strings, single slash, or undefined values.
 * This function is idempotent - calling it multiple times produces the same result.
 *
 * @param basePath - The base path to normalize
 * @returns Normalized base path or undefined if the path is effectively empty
 *
 * @example
 * normalizeBasePath("/api/v1/") // "/api/v1"
 * normalizeBasePath("api/v1")   // "/api/v1"
 * normalizeBasePath("/")        // undefined
 * normalizeBasePath("")         // undefined
 * normalizeBasePath(undefined)  // undefined
 */
export function normalizeBasePath(basePath?: string): string | undefined {
	if (!basePath || basePath === "/" || basePath.trim() === "") {
		return undefined;
	}

	let normalized = basePath.trim();

	// Ensure leading slash
	if (!normalized.startsWith("/")) {
		normalized = `/${normalized}`;
	}

	// Remove trailing slash
	if (normalized.endsWith("/")) {
		normalized = normalized.slice(0, -1);
	}

	return normalized;
}

/**
 * Constructs the full path by combining base path with endpoint path
 *
 * Ensures proper slash handling to avoid double slashes.
 * If basePath is undefined or empty, returns the original path unchanged.
 *
 * @param basePath - The normalized base path (optional)
 * @param path - The endpoint path from OpenAPI spec
 * @returns The complete path
 *
 * @example
 * constructFullPath("/api/v1", "/users")     // "/api/v1/users"
 * constructFullPath("/api/v1", "users")      // "/api/v1/users"
 * constructFullPath(undefined, "/users")     // "/users"
 * constructFullPath("", "/users")            // "/users"
 */
export function constructFullPath(basePath: string | undefined, path: string): string {
	if (!basePath) {
		return path;
	}

	// Ensure path has leading slash
	let normalizedPath = path.trim();
	if (!normalizedPath.startsWith("/")) {
		normalizedPath = `/${normalizedPath}`;
	}

	return basePath + normalizedPath;
}
