/**
 * Default preferred content types for response handling
 */
export const DEFAULT_PREFERRED_CONTENT_TYPES = ["application/json"];

/**
 * Normalizes a content type by removing parameters (like charset) and converting to lowercase
 *
 * @param contentType - The content type to normalize
 * @returns The normalized content type
 *
 * @example
 * normalizeContentType("application/json; charset=utf-8") // "application/json"
 * normalizeContentType("Text/JSON") // "text/json"
 */
export function normalizeContentType(contentType: string): string {
	return contentType.split(";")[0].trim().toLowerCase();
}

/**
 * Selects the best content type from available options based on preference order.
 *
 * @param availableContentTypes - Content types available in the response
 * @param preferredContentTypes - Ordered list of preferred content types (default: ["application/json"])
 * @returns The selected content type, or the first available if no preference matches
 *
 * @example
 * // Returns "application/json" (preferred match)
 * selectContentType(["text/plain", "application/json"], ["application/json", "text/json"])
 *
 * @example
 * // Returns "text/json" (second preference matches)
 * selectContentType(["text/json", "text/plain"], ["application/json", "text/json"])
 *
 * @example
 * // Returns "text/plain" (first available, no preference match)
 * selectContentType(["text/plain", "text/html"], ["application/json"])
 */
export function selectContentType(
	availableContentTypes: string[],
	preferredContentTypes: string[] = DEFAULT_PREFERRED_CONTENT_TYPES
): string | undefined {
	if (availableContentTypes.length === 0) {
		return undefined;
	}

	// Try each preferred content type in order
	for (const preferred of preferredContentTypes) {
		// Check for exact match (case-insensitive, ignoring parameters like charset)
		const match = availableContentTypes.find(available => {
			const normalizedAvailable = normalizeContentType(available);
			const normalizedPreferred = normalizeContentType(preferred);
			return normalizedAvailable === normalizedPreferred;
		});

		if (match) {
			return match;
		}
	}

	// Fall back to first available content type
	return availableContentTypes[0];
}
