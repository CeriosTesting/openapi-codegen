import { MissingDependencyError } from "@cerios/openapi-core";

const CORE_PACKAGE = "@cerios/openapi-core";
const TYPESCRIPT_PACKAGE = "@cerios/openapi-to-typescript";

/**
 * Checks if the required core packages are installed.
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

	try {
		require.resolve(TYPESCRIPT_PACKAGE);
	} catch {
		throw new MissingDependencyError(
			`${TYPESCRIPT_PACKAGE} is required but not installed.\n` + `Please install it: npm install ${TYPESCRIPT_PACKAGE}`,
			TYPESCRIPT_PACKAGE
		);
	}
}
