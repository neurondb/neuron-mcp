/**
 * Base Tool class for all MCP tools
 */

import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";
import { ToolDefinition, ToolResult } from "../registry.js";

export abstract class BaseTool {
	protected db: Database;
	protected logger: Logger;

	constructor(db: Database, logger: Logger) {
		this.db = db;
		this.logger = logger;
	}

	/**
	 * Get tool definition (name, description, input schema)
	 */
	abstract getDefinition(): ToolDefinition;

	/**
	 * Execute the tool with given parameters
	 */
	abstract execute(params: Record<string, any>): Promise<ToolResult>;

	/**
	 * Validate input parameters
	 */
	protected validateParams(params: Record<string, any>, schema: any): { valid: boolean; errors: string[] } {
		const errors: string[] = [];
		const required = schema.required || [];

		// Check required parameters
		for (const field of required) {
			if (!(field in params) || params[field] === undefined || params[field] === null) {
				errors.push(`Missing required parameter: ${field}`);
			}
		}

		// Validate parameter types
		if (schema.properties) {
			for (const [key, value] of Object.entries(params)) {
				const propSchema = schema.properties[key];
				if (propSchema) {
					const typeError = this.validateType(value, propSchema);
					if (typeError) {
						errors.push(`Invalid type for ${key}: ${typeError}`);
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
	 * Validate parameter type
	 */
	private validateType(value: any, schema: any): string | null {
		if (schema.type === "string" && typeof value !== "string") {
			return "expected string";
		}
		if (schema.type === "number" && typeof value !== "number") {
			return "expected number";
		}
		if (schema.type === "boolean" && typeof value !== "boolean") {
			return "expected boolean";
		}
		if (schema.type === "array" && !Array.isArray(value)) {
			return "expected array";
		}
		if (schema.type === "object" && (typeof value !== "object" || Array.isArray(value))) {
			return "expected object";
		}

		// Validate array items
		if (schema.type === "array" && schema.items) {
			for (const item of value) {
				const itemError = this.validateType(item, schema.items);
				if (itemError) {
					return `array item ${itemError}`;
				}
			}
		}

		// Validate enum
		if (schema.enum && !schema.enum.includes(value)) {
			return `must be one of: ${schema.enum.join(", ")}`;
		}

		// Validate number constraints
		if (schema.type === "number") {
			if (schema.minimum !== undefined && value < schema.minimum) {
				return `must be >= ${schema.minimum}`;
			}
			if (schema.maximum !== undefined && value > schema.maximum) {
				return `must be <= ${schema.maximum}`;
			}
		}

		return null;
	}

	/**
	 * Create success result
	 */
	protected success(data: any, metadata?: Record<string, any>): ToolResult {
		return {
			success: true,
			data,
			metadata,
		};
	}

	/**
	 * Create error result
	 */
	protected error(message: string, code?: string, details?: any): ToolResult {
		return {
			success: false,
			error: {
				message,
				code,
				details,
			},
		};
	}
}

