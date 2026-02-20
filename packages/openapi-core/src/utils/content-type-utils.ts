/**
 * Content type utilities for determining response parsing methods
 */

/**
 * Result of content type analysis
 */
export interface ContentTypeParseResult {
	/**
	 * The recommended parsing method
	 * - "json": Use response.json() for JSON content types
	 * - "text": Use response.text() for text-based content types
	 * - "body": Use response.body() for binary content types
	 */
	method: "json" | "text" | "body";

	/**
	 * Whether the content type was unknown and fallback was used
	 */
	isUnknown: boolean;
}

/**
 * Fallback parsing method for unknown content types
 */
export type FallbackContentTypeParsing = "json" | "text" | "body";

/**
 * Determines the appropriate response parsing method based on content type
 *
 * Categories:
 * - JSON: application/json, text/json, *+json suffix
 * - Text: text/* (except text/json), application/xml, *+xml suffix, application/javascript
 * - Binary: image/*, audio/*, video/*, font/*, application/octet-stream, application/pdf, etc.
 *
 * @param contentType - The content type to analyze (e.g., "application/json; charset=utf-8")
 * @param fallback - The method to use for unknown content types (default: "text" for safety)
 * @returns The recommended parsing method and whether the content type was unknown
 */
export function getResponseParseMethod(
	contentType: string | undefined,
	fallback: FallbackContentTypeParsing = "text"
): ContentTypeParseResult {
	// Handle missing content type
	if (!contentType) {
		return { method: fallback, isUnknown: true };
	}

	// Normalize: lowercase, strip charset and parameters
	const normalized = contentType.toLowerCase().split(";")[0].trim();

	// Empty after normalization
	if (!normalized) {
		return { method: fallback, isUnknown: true };
	}

	// JSON family
	if (normalized === "application/json" || normalized === "text/json" || normalized.endsWith("+json")) {
		return { method: "json", isUnknown: false };
	}

	// Text family - text/* (except text/json already handled above)
	if (normalized.startsWith("text/")) {
		return { method: "text", isUnknown: false };
	}

	// XML family - both standalone and suffix
	if (
		normalized === "application/xml" ||
		normalized.endsWith("+xml") // includes image/svg+xml
	) {
		return { method: "text", isUnknown: false };
	}

	// JavaScript family (text-based)
	if (
		normalized === "application/javascript" ||
		normalized === "application/x-javascript" ||
		normalized === "application/ecmascript"
	) {
		return { method: "text", isUnknown: false };
	}

	// Binary - images
	if (normalized.startsWith("image/")) {
		return { method: "body", isUnknown: false };
	}

	// Binary - audio
	if (normalized.startsWith("audio/")) {
		return { method: "body", isUnknown: false };
	}

	// Binary - video
	if (normalized.startsWith("video/")) {
		return { method: "body", isUnknown: false };
	}

	// Binary - fonts
	if (normalized.startsWith("font/")) {
		return { method: "body", isUnknown: false };
	}

	// Binary - common application types
	if (
		normalized === "application/octet-stream" ||
		normalized === "application/pdf" ||
		normalized === "application/zip" ||
		normalized === "application/gzip" ||
		normalized === "application/x-tar" ||
		normalized === "application/x-7z-compressed" ||
		normalized === "application/x-rar-compressed" ||
		normalized === "application/wasm" ||
		normalized === "application/x-protobuf"
	) {
		return { method: "body", isUnknown: false };
	}

	// Unknown content type - use fallback
	return { method: fallback, isUnknown: true };
}

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
 * Selects the best content type from available options based on preference order
 *
 * This function tries each preferred content type in order and returns the first match.
 * Matching is case-insensitive and ignores parameters like charset.
 * If no preferred content type matches, returns the first available content type.
 *
 * @param availableContentTypes - Content types available in the response
 * @param preferredContentTypes - Ordered list of preferred content types (default: ["application/json"])
 * @returns The selected content type, or undefined if no content types are available
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
