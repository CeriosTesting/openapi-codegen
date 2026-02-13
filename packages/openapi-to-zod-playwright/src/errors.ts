/**
 * Playwright-specific error classes
 *
 * For core errors (ConfigurationError, etc.), import from @cerios/openapi-core
 */

import { GeneratorError } from "@cerios/openapi-core";

/**
 * Thrown when client/service generation fails
 */
export class ClientGenerationError extends GeneratorError {
	constructor(message: string, cause?: Error) {
		super(message, "CLIENT_GENERATION_ERROR", { cause: cause?.message });
		this.name = "ClientGenerationError";
	}
}
