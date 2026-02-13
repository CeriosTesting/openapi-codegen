/**
 * CLI Utilities for OpenAPI generators
 *
 * Shared utilities for command-line interface implementations
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Fun branding messages for CLI output
 */
export const ceriosMessages = [
	"Things just got Cerios!",
	"Getting Cerios about schemas!",
	"Cerios business ahead!",
	"Don't take it too Cerios-ly!",
	"Time to get Cerios!",
	"We're dead Cerios about types!",
	"This is Cerios-ly awesome!",
	"Cerios-ly, you're all set!",
	"You are Cerios right now!",
	"Cerios vibes only!",
] as const;

/**
 * Get a random Cerios message for CLI output
 * @returns A random fun branding message
 */
export function getRandomCeriosMessage(): string {
	return ceriosMessages[Math.floor(Math.random() * ceriosMessages.length)];
}

export interface SpecFile {
	path: string;
	size: string;
}

export interface FindSpecFilesResult {
	files: SpecFile[];
	totalCount: number;
}

export interface FindSpecFilesOptions {
	/**
	 * Folders to search for spec files
	 * @default ["spec", "specs"]
	 */
	specFolders?: string[];

	/**
	 * Valid file extensions for OpenAPI specs
	 * @default [".yaml", ".yml", ".json"]
	 */
	validExtensions?: string[];

	/**
	 * Patterns to exclude from search
	 * @default ["node_modules", ".git", "dist", "build", "coverage"]
	 */
	excludePatterns?: string[];

	/**
	 * Maximum number of files to return
	 * @default 20
	 */
	maxResults?: number;
}

/**
 * Find OpenAPI spec files in spec/ or specs/ folders
 *
 * @param options - Optional configuration for file search
 * @returns Object with files (path + size) and totalCount
 */
export function findSpecFiles(options: FindSpecFilesOptions = {}): FindSpecFilesResult {
	const {
		specFolders = ["spec", "specs"],
		validExtensions = [".yaml", ".yml", ".json"],
		excludePatterns = ["node_modules", ".git", "dist", "build", "coverage"],
		maxResults = 20,
	} = options;

	const allFiles: SpecFile[] = [];

	for (const folder of specFolders) {
		if (!existsSync(folder)) continue;

		try {
			const entries = readdirSync(folder, { recursive: true, encoding: "utf-8" });

			for (const entry of entries) {
				const fullPath = join(folder, entry as string);

				// Skip if path contains excluded patterns
				if (excludePatterns.some(pattern => fullPath.includes(pattern))) continue;

				try {
					const stats = statSync(fullPath);
					if (!stats.isFile()) continue;

					// Check if file has valid extension
					const hasValidExt = validExtensions.some(ext => fullPath.endsWith(ext));
					if (!hasValidExt) continue;

					// Format file size
					const sizeKB = (stats.size / 1024).toFixed(2);
					allFiles.push({ path: fullPath.replace(/\\/g, "/"), size: `${sizeKB} KB` });
				} catch {
					// Skip files that can't be stat'd
				}
			}
		} catch {
			// Skip folders that can't be read
		}
	}

	// Sort alphabetically
	allFiles.sort((a, b) => a.path.localeCompare(b.path));

	const totalCount = allFiles.length;
	const files = allFiles.slice(0, maxResults);

	return { files, totalCount };
}
