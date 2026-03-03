/**
 * Project management tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class CreateMLProjectTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "create_ml_project",
			description: "Create a new ML project",
			inputSchema: {
				type: "object",
				properties: {
					project_name: { type: "string", description: "Project name" },
					description: { type: "string", description: "Project description" },
				},
				required: ["project_name"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { project_name, description } = params;
			const query = `
				INSERT INTO neurondb.ml_projects (project_name, description, created_at)
				VALUES ($1, $2, NOW())
				RETURNING project_id, project_name, description, created_at
			`;
			const result = await this.executor.executeQueryOne(query, [project_name, description || null]);
			return this.success(result, { project_name });
		} catch (error) {
			this.logger.error("Create ML project failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Create ML project failed",
				"PROJECT_ERROR"
			);
		}
	}
}

export class ListMLProjectsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "list_ml_projects",
			description: "List all ML projects",
			inputSchema: {
				type: "object",
				properties: {
					limit: { type: "number", default: 100, minimum: 1, maximum: 1000 },
				},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		try {
			const { limit = 100 } = params;
			const query = `
				SELECT * FROM neurondb.ml_projects
				ORDER BY created_at DESC
				LIMIT $1
			`;
			const results = await this.executor.executeQuery(query, [limit]);
			return this.success(results, { count: results.length });
		} catch (error) {
			this.logger.error("List ML projects failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "List ML projects failed", "PROJECT_ERROR");
		}
	}
}





