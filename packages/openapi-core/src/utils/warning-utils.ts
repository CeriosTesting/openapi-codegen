/**
 * Warning utilities for consistent warning output across all packages
 */

export interface WarningContext {
	/** Package name for warning prefix */
	packageName: string;
	/** Whether warnings are enabled */
	enabled: boolean;
}

/**
 * Create a warning logger that respects the showWarnings option
 *
 * @param context - Warning context with package name and enabled state
 * @returns A function that logs warnings when enabled
 *
 * @example
 * const warn = createWarningLogger({ packageName: "@cerios/openapi-to-zod", enabled: true });
 * warn("Something unexpected happened");
 * // Logs: [@cerios/openapi-to-zod] Warning: Something unexpected happened
 */
export function createWarningLogger(context: WarningContext): (message: string) => void {
	return (message: string) => {
		if (context.enabled) {
			console.warn(`[${context.packageName}] Warning: ${message}`);
		}
	};
}

/**
 * Collect warnings during generation for deferred output in a separate section
 */
export class WarningCollector {
	private warnings: string[] = [];
	private readonly packageName: string;
	private readonly enabled: boolean;

	constructor(context: WarningContext) {
		this.packageName = context.packageName;
		this.enabled = context.enabled;
	}

	/**
	 * Add a warning message
	 */
	add(message: string): void {
		if (this.enabled) {
			this.warnings.push(message);
		}
	}

	/**
	 * Check if there are any warnings
	 */
	hasWarnings(): boolean {
		return this.warnings.length > 0;
	}

	/**
	 * Get all collected warnings
	 */
	getWarnings(): readonly string[] {
		return this.warnings;
	}

	/**
	 * Flush all warnings to console in a dedicated section
	 */
	flush(): void {
		if (!this.enabled || this.warnings.length === 0) {
			return;
		}

		console.warn(`\n[${this.packageName}] Warnings:`);
		for (const warning of this.warnings) {
			console.warn(`  ⚠️  ${warning}`);
		}
		console.warn(""); // Empty line after warnings
	}

	/**
	 * Clear all collected warnings
	 */
	clear(): void {
		this.warnings = [];
	}

	/**
	 * Get count of collected warnings
	 */
	get count(): number {
		return this.warnings.length;
	}
}
