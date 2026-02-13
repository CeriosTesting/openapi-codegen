/**
 * K6-specific error classes
 *
 * For core errors (ConfigurationError, etc.), import from @cerios/openapi-core
 */

import { GeneratorError } from "@cerios/openapi-core";

/**
 * Thrown when K6 client generation fails
 */
export class K6ClientGenerationError extends GeneratorError {
	constructor(message: string, cause?: Error) {
		super(message, "K6_CLIENT_GENERATION_ERROR", { cause: cause?.message });
		this.name = "K6ClientGenerationError";
	}
}
