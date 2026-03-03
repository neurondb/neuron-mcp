/**
 * Parameter validation utilities
 */

export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

export class ParameterValidator {
	/**
	 * Validate parameters against JSON schema
	 */
	static validate(params: Record<string, any>, schema: any): ValidationResult {
		const errors: string[] = [];
		const required = schema.required || [];

		// Check required parameters
		for (const field of required) {
			if (!(field in params) || params[field] === undefined || params[field] === null) {
				errors.push(`Missing required parameter: ${field}`);
			}
		}

		// Validate parameter types and constraints
		if (schema.properties) {
			for (const [key, value] of Object.entries(params)) {
				const propSchema = schema.properties[key];
				if (propSchema) {
					const validationError = this.validateProperty(value, propSchema, key);
					if (validationError) {
						errors.push(validationError);
					}
				}
			}
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate a single property
	 */
	private static validateProperty(value: any, schema: any, key: string): string | null {
		// Type validation
		if (schema.type === "string" && typeof value !== "string") {
			return `${key}: expected string, got ${typeof value}`;
		}
		if (schema.type === "number" && typeof value !== "number") {
			return `${key}: expected number, got ${typeof value}`;
		}
		if (schema.type === "boolean" && typeof value !== "boolean") {
			return `${key}: expected boolean, got ${typeof value}`;
		}
		if (schema.type === "array" && !Array.isArray(value)) {
			return `${key}: expected array, got ${typeof value}`;
		}
		if (schema.type === "object" && (typeof value !== "object" || Array.isArray(value) || value === null)) {
			return `${key}: expected object, got ${typeof value}`;
		}

		// Array item validation
		if (schema.type === "array" && schema.items) {
			for (let i = 0; i < value.length; i++) {
				const itemError = this.validateProperty(value[i], schema.items, `${key}[${i}]`);
				if (itemError) {
					return itemError;
				}
			}
		}

		// Enum validation
		if (schema.enum && !schema.enum.includes(value)) {
			return `${key}: must be one of: ${schema.enum.join(", ")}`;
		}

		// Number constraints
		if (schema.type === "number") {
			if (schema.minimum !== undefined && value < schema.minimum) {
				return `${key}: must be >= ${schema.minimum}`;
			}
			if (schema.maximum !== undefined && value > schema.maximum) {
				return `${key}: must be <= ${schema.maximum}`;
			}
		}

		// String constraints
		if (schema.type === "string") {
			if (schema.minLength !== undefined && value.length < schema.minLength) {
				return `${key}: must have length >= ${schema.minLength}`;
			}
			if (schema.maxLength !== undefined && value.length > schema.maxLength) {
				return `${key}: must have length <= ${schema.maxLength}`;
			}
			if (schema.pattern) {
				const regex = new RegExp(schema.pattern);
				if (!regex.test(value)) {
					return `${key}: must match pattern ${schema.pattern}`;
				}
			}
		}

		// Array constraints
		if (schema.type === "array") {
			if (schema.minItems !== undefined && value.length < schema.minItems) {
				return `${key}: must have at least ${schema.minItems} items`;
			}
			if (schema.maxItems !== undefined && value.length > schema.maxItems) {
				return `${key}: must have at most ${schema.maxItems} items`;
			}
		}

		return null;
	}
}





