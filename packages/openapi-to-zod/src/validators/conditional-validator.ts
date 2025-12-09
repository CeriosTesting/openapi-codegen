import type { OpenAPISchema } from "../types";

/**
 * Generate property access expression (use dot notation for valid identifiers, bracket notation otherwise)
 */
function generatePropertyAccess(propName: string): string {
	// Valid identifier: starts with letter/underscore/$, followed by letters/digits/underscores/$
	const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
	return validIdentifier.test(propName) ? `obj.${propName}` : `obj["${propName}"]`;
}

/**
 * Generate validation for dependencies (OpenAPI 3.0)
 * Generates detailed error messages showing which specific fields are missing
 */
export function generateDependencies(
	schema: OpenAPISchema,
	generatePropertySchema?: (schema: OpenAPISchema, currentSchema?: string) => string,
	currentSchema?: string
): string {
	if (!schema.dependencies) {
		return "";
	}

	let result = "";
	for (const [prop, dependency] of Object.entries(schema.dependencies)) {
		if (Array.isArray(dependency)) {
			// Skip empty dependency arrays (no dependencies to enforce)
			if (dependency.length === 0) {
				continue;
			}

			// Property dependency - show specific missing properties in error message
			const propAccess = generatePropertyAccess(prop);
			const checkLogic = dependency
				.map(p => {
					const pAccess = generatePropertyAccess(p);
					return `if (${pAccess} === undefined) missing.push('${p}');`;
				})
				.join("\n\t\t");

			result += `.superRefine((obj, ctx) => {
				if (${propAccess} === undefined) return;
				const missing: string[] = [];
				${checkLogic}
				if (missing.length > 0) {
					ctx.addIssue({
						code: "custom",
						message: \`When '${prop}' is present, the following properties are required: \${missing.join(', ')}\`,
						path: []
					});
				}
			})`;
		} else if (generatePropertySchema) {
			// Schema dependency - show detailed validation errors
			const depSchema: OpenAPISchema = { ...dependency, type: dependency.type || "object" };
			const depSchemaValidation = generatePropertySchema(depSchema, currentSchema);
			const propAccess = generatePropertyAccess(prop);

			result += `.superRefine((obj, ctx) => {
				if (${propAccess} === undefined) return;
				const validation = ${depSchemaValidation}.safeParse(obj);
				if (!validation.success) {
					const errors = validation.error.issues.map(i => \`  - \${i.path.join('.')}: \${i.message}\`).join('\\n');
					ctx.addIssue({
						code: "custom",
						message: \`When '${prop}' is present, object must satisfy additional constraints:\\n\${errors}\`,
						path: []
					});
				}
			})`;
		}
	}
	return result;
}

/**
 * Generate condition check for if/then/else
 */
export function generateConditionalCheck(schema: OpenAPISchema): string {
	const conditions: string[] = [];

	// Check properties
	if (schema.properties) {
		for (const [prop, propSchema] of Object.entries(schema.properties)) {
			const propAccess = generatePropertyAccess(prop);
			if (propSchema.type) {
				conditions.push(`typeof ${propAccess} === "${propSchema.type}"`);
			}
			if (propSchema.const !== undefined) {
				const value = typeof propSchema.const === "string" ? `"${propSchema.const}"` : propSchema.const;
				conditions.push(`${propAccess} === ${value}`);
			}
			if (propSchema.minimum !== undefined) {
				conditions.push(`${propAccess} >= ${propSchema.minimum}`);
			}
			if (propSchema.maximum !== undefined) {
				conditions.push(`${propAccess} <= ${propSchema.maximum}`);
			}
		}
	}

	// Check required properties
	if (schema.required) {
		for (const prop of schema.required) {
			conditions.push(`${generatePropertyAccess(prop)} !== undefined`);
		}
	}

	return conditions.length > 0 ? conditions.join(" && ") : "true";
}

/**
 * Generate validation for then/else clauses
 */
export function generateConditionalValidation(schema: OpenAPISchema): string {
	const checks: string[] = [];

	// Check required properties
	if (schema.required) {
		for (const prop of schema.required) {
			checks.push(`${generatePropertyAccess(prop)} !== undefined`);
		}
	}

	// Check properties constraints
	if (schema.properties) {
		for (const [prop, propSchema] of Object.entries(schema.properties)) {
			const propAccess = generatePropertyAccess(prop);
			if (propSchema.minimum !== undefined) {
				checks.push(`${propAccess} === undefined || ${propAccess} >= ${propSchema.minimum}`);
			}
			if (propSchema.maximum !== undefined) {
				checks.push(`${propAccess} === undefined || ${propAccess} <= ${propSchema.maximum}`);
			}
		}
	}

	return checks.length > 0 ? checks.join(" && ") : "true";
}

/**
 * Generate if/then/else conditional validation with better error messages
 * Uses superRefine with detailed error messages for complex cases
 */
export function generateIfThenElse(schema: OpenAPISchema): string {
	if (!schema.if || (!schema.then && !schema.else)) {
		return "";
	}

	const ifCondition = generateConditionalCheck(schema.if);

	if (schema.then && schema.else) {
		// Both then and else - provide detailed error messages
		const thenValidation = generateConditionalValidation(schema.then);
		const elseValidation = generateConditionalValidation(schema.else);

		// Try to detect which specific validations failed
		const thenRequiredProps = schema.then.required || [];
		const elseRequiredProps = schema.else.required || [];

		return `.superRefine((obj, ctx) => {
			const ifConditionMet = ${ifCondition};
			if (ifConditionMet) {
				// Then branch
				const thenValid = ${thenValidation};
				if (!thenValid) {
					${
						thenRequiredProps.length > 0
							? `
					const missingThenProps = ${JSON.stringify(thenRequiredProps)}.filter(p => obj[p] === undefined);
					const message = missingThenProps.length > 0 
						? \`When condition is met, required properties are missing: \${missingThenProps.join(', ')}\`
						: "When condition is met, validation constraints failed";
					`
							: `
					const message = "When condition is met, validation constraints failed";
					`
					}
					ctx.addIssue({
						code: "custom",
						message: message,
						path: []
					});
				}
			} else {
				// Else branch
				const elseValid = ${elseValidation};
				if (!elseValid) {
					${
						elseRequiredProps.length > 0
							? `
					const missingElseProps = ${JSON.stringify(elseRequiredProps)}.filter(p => obj[p] === undefined);
					const message = missingElseProps.length > 0 
						? \`When condition is not met, required properties are missing: \${missingElseProps.join(', ')}\`
						: "When condition is not met, validation constraints failed";
					`
							: `
					const message = "When condition is not met, validation constraints failed";
					`
					}
					ctx.addIssue({
						code: "custom",
						message: message,
						path: []
					});
				}
			}
		})`;
	}

	if (schema.then) {
		// Only then - provide detailed error message
		const thenValidation = generateConditionalValidation(schema.then);
		const thenRequiredProps = schema.then.required || [];

		return `.superRefine((obj, ctx) => {
			const ifConditionMet = ${ifCondition};
			if (ifConditionMet) {
				const thenValid = ${thenValidation};
				if (!thenValid) {
					${
						thenRequiredProps.length > 0
							? `
					const missingProps = ${JSON.stringify(thenRequiredProps)}.filter(p => obj[p] === undefined);
					const message = missingProps.length > 0 
						? \`When condition is met, required properties are missing: \${missingProps.join(', ')}\`
						: "When condition is met, validation constraints failed";
					`
							: `
					const message = "When condition is met, validation constraints failed";
					`
					}
					ctx.addIssue({
						code: "custom",
						message: message,
						path: []
					});
				}
			}
		})`;
	}

	// Only else - provide detailed error message
	if (!schema.else) return "";
	const elseValidation = generateConditionalValidation(schema.else);
	const elseRequiredProps = schema.else.required || [];

	return `.superRefine((obj, ctx) => {
		const ifConditionMet = ${ifCondition};
		if (!ifConditionMet) {
			const elseValid = ${elseValidation};
			if (!elseValid) {
				${
					elseRequiredProps.length > 0
						? `
				const missingProps = ${JSON.stringify(elseRequiredProps)}.filter(p => obj[p] === undefined);
				const message = missingProps.length > 0 
					? \`When condition is not met, required properties are missing: \${missingProps.join(', ')}\`
					: "When condition is not met, validation constraints failed";
				`
						: `
				const message = "When condition is not met, validation constraints failed";
				`
				}
				ctx.addIssue({
					code: "custom",
					message: message,
					path: []
				});
			}
		}
	})`;
}

/**
 * Generate dependent required validation (OpenAPI 3.1)
 * Generates detailed error messages showing which specific fields are missing
 */
export function generateDependentRequired(schema: OpenAPISchema): string {
	if (!schema.dependentRequired) {
		return "";
	}

	let result = "";
	for (const [prop, requiredProps] of Object.entries(schema.dependentRequired)) {
		// Skip empty required arrays (no dependencies to enforce)
		if (requiredProps.length === 0) {
			continue;
		}

		const propAccess = generatePropertyAccess(prop);
		const checkLogic = requiredProps
			.map(rp => {
				const rpAccess = generatePropertyAccess(rp);
				return `if (${rpAccess} === undefined) missing.push('${rp}');`;
			})
			.join("\n\t\t");

		result += `.superRefine((obj, ctx) => {
			if (${propAccess} === undefined) return;
			const missing: string[] = [];
			${checkLogic}
			if (missing.length > 0) {
				ctx.addIssue({
					code: "custom",
					message: \`When '${prop}' is present, the following properties are required: \${missing.join(', ')}\`,
					path: []
				});
			}
		})`;
	}

	return result;
}

/**
 * Generate dependent schemas validation (JSON Schema 2019-09 / OpenAPI 3.1)
 * This is the modern replacement for schema-based dependencies
 * Generates detailed error messages showing validation failures
 */
export function generateDependentSchemas(
	schema: OpenAPISchema & { dependentSchemas?: Record<string, OpenAPISchema> },
	generatePropertySchema?: (schema: OpenAPISchema, currentSchema?: string) => string,
	currentSchema?: string
): string {
	if (!schema.dependentSchemas || !generatePropertySchema) {
		return "";
	}

	let result = "";
	for (const [prop, depSchema] of Object.entries(schema.dependentSchemas)) {
		const depSchemaValidation = generatePropertySchema(depSchema, currentSchema);
		const propAccess = generatePropertyAccess(prop);

		result += `.superRefine((obj, ctx) => {
			if (${propAccess} === undefined) return;
			const validation = ${depSchemaValidation}.safeParse(obj);
			if (!validation.success) {
				const errors = validation.error.issues.map(i => \`  - \${i.path.join('.')}: \${i.message}\`).join('\\n');
				ctx.addIssue({
					code: "custom",
					message: \`When '${prop}' is present, dependent schema validation failed:\\n\${errors}\`,
					path: []
				});
			}
		})`;
	}
	return result;
}

/**
 * Validate dependency graph for circular dependencies
 * Returns validation result with any detected circular dependency errors
 */
export function validateDependencyGraph(
	schema: OpenAPISchema,
	schemaName: string
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!schema.dependencies && !schema.dependentRequired) {
		return { valid: true, errors: [] };
	}

	// Build dependency graph
	const graph = new Map<string, Set<string>>();

	// Add dependentRequired edges
	if (schema.dependentRequired) {
		for (const [prop, deps] of Object.entries(schema.dependentRequired)) {
			if (!graph.has(prop)) {
				graph.set(prop, new Set());
			}
			const propDeps = graph.get(prop);
			if (propDeps) {
				for (const dep of deps) {
					propDeps.add(dep);
				}
			}
		}
	}

	// Add dependencies (array type) edges
	if (schema.dependencies) {
		for (const [prop, dep] of Object.entries(schema.dependencies)) {
			if (Array.isArray(dep)) {
				if (!graph.has(prop)) {
					graph.set(prop, new Set());
				}
				const propDeps = graph.get(prop);
				if (propDeps) {
					for (const d of dep) {
						propDeps.add(d);
					}
				}
			}
		}
	}

	// Detect cycles using DFS
	const visited = new Set<string>();
	const recStack = new Set<string>();
	const path: string[] = [];

	function detectCycle(prop: string): boolean {
		visited.add(prop);
		recStack.add(prop);
		path.push(prop);

		const deps = graph.get(prop) || new Set();
		for (const dep of deps) {
			if (!visited.has(dep)) {
				if (detectCycle(dep)) {
					return true;
				}
			} else if (recStack.has(dep)) {
				// Cycle detected
				const cycleStart = path.indexOf(dep);
				const cycle = [...path.slice(cycleStart), dep];
				errors.push(`Circular dependency detected in schema '${schemaName}': ${cycle.join(" -> ")}`);
				return true;
			}
		}

		recStack.delete(prop);
		path.pop();
		return false;
	}

	// Check all roots
	for (const prop of graph.keys()) {
		if (!visited.has(prop)) {
			detectCycle(prop);
		}
	}

	return { valid: errors.length === 0, errors };
}

/**
 * Extract schema dependencies as reusable schemas
 * Useful for code generation and schema reuse
 */
export function extractSchemaDependencies(schema: OpenAPISchema, schemaName: string): Map<string, OpenAPISchema> {
	const extracted = new Map<string, OpenAPISchema>();

	if (!schema.dependencies) {
		return extracted;
	}

	for (const [prop, dependency] of Object.entries(schema.dependencies)) {
		if (!Array.isArray(dependency)) {
			// This is a schema dependency
			const depSchemaName = `${schemaName}_${prop}_Dependency`;
			const depSchema: OpenAPISchema = {
				...dependency,
				type: dependency.type || "object",
			};
			extracted.set(depSchemaName, depSchema);
		}
	}

	return extracted;
}
