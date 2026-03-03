/**
 * Tool registry system for managing all MCP tools
 */

import { BaseTool } from "./base/tool.js";
import { Database } from "../database/connection.js";
import { Logger } from "../logging/logger.js";

export interface ToolDefinition {
	name: string;
	description: string;
	inputSchema: {
		type: "object";
		properties: Record<string, any>;
		required?: string[];
	};
}

export interface ToolResult {
	success: boolean;
	data?: any;
	error?: {
		message: string;
		code?: string;
		details?: any;
	};
	metadata?: Record<string, any>;
}

export class ToolRegistry {
	private tools: Map<string, BaseTool> = new Map();
	private definitions: Map<string, ToolDefinition> = new Map();

	constructor(private db: Database, private logger: Logger) {}

	/**
	 * Register a tool
	 */
	register(tool: BaseTool): void {
		const definition = tool.getDefinition();
		this.tools.set(definition.name, tool);
		this.definitions.set(definition.name, definition);
		this.logger.debug(`Registered tool: ${definition.name}`);
	}

	/**
	 * Register multiple tools
	 */
	registerAll(tools: BaseTool[]): void {
		for (const tool of tools) {
			this.register(tool);
		}
	}

	/**
	 * Get tool by name
	 */
	getTool(name: string): BaseTool | undefined {
		return this.tools.get(name);
	}

	/**
	 * Get tool definition by name
	 */
	getDefinition(name: string): ToolDefinition | undefined {
		return this.definitions.get(name);
	}

	/**
	 * Get all tool definitions
	 */
	getAllDefinitions(): ToolDefinition[] {
		return Array.from(this.definitions.values());
	}

	/**
	 * Get all tool names
	 */
	getAllToolNames(): string[] {
		return Array.from(this.tools.keys());
	}

	/**
	 * Check if tool exists
	 */
	hasTool(name: string): boolean {
		return this.tools.has(name);
	}

	/**
	 * Unregister a tool
	 */
	unregister(name: string): boolean {
		const removed = this.tools.delete(name) && this.definitions.delete(name);
		if (removed) {
			this.logger.debug(`Unregistered tool: ${name}`);
		}
		return removed;
	}

	/**
	 * Clear all tools
	 */
	clear(): void {
		this.tools.clear();
		this.definitions.clear();
	}

	/**
	 * Get tool count
	 */
	getCount(): number {
		return this.tools.size;
	}
}





