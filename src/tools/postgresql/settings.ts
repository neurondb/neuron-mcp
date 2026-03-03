/**
 * PostgreSQL settings tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLSettingsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_settings",
			description: "Get PostgreSQL configuration settings",
			inputSchema: {
				type: "object",
				properties: {
					pattern: {
						type: "string",
						description: "Optional pattern to filter settings (e.g., 'shared_buffers')",
					},
				},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const pattern = params.pattern as string | undefined;
			let query: string;
			let queryParams: any[] = [];

			if (pattern) {
				query = `
					SELECT 
						name,
						setting,
						unit,
						category,
						short_desc,
						context,
						vartype,
						source,
						min_val,
						max_val,
						enumvals
					FROM pg_settings
					WHERE name LIKE $1
					ORDER BY name
				`;
				queryParams = [`%${pattern}%`];
			} else {
				query = `
					SELECT 
						name,
						setting,
						unit,
						category,
						short_desc,
						context,
						vartype,
						source,
						min_val,
						max_val,
						enumvals
					FROM pg_settings
					ORDER BY category, name
				`;
			}

			const settings = await this.executor.executeQuery(query, queryParams);

			return this.success(
				{
					settings,
					count: settings.length,
				},
				{
					tool: "postgresql_settings",
					count: settings.length,
				}
			);
		} catch (error) {
			this.logger.error("PostgreSQL settings query failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL settings query failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






