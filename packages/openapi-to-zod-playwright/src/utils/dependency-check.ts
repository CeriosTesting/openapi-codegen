import { MissingDependencyError } from "../errors";

const CORE_PACKAGE = "@cerios/openapi-to-zod";

/**
 * Checks if the core @cerios/openapi-to-zod package is installed.
 * Throws a MissingDependencyError with clear installation instructions if not found.
 *
 * This check runs at module load time to provide a user-friendly error message
 * instead of a cryptic Node.js module resolution failure.
 */
export function checkCoreDependency(): void {
	try {
		require.resolve(CORE_PACKAGE);
	} catch {
		throw new MissingDependencyError(
			`${CORE_PACKAGE} is required but not installed.\n` + `Please install it: npm install ${CORE_PACKAGE}`,
			CORE_PACKAGE
		);
	}
}
