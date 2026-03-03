/**
 * PostgreSQL connections tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLConnectionsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_connections",
			description: "Get detailed PostgreSQL connection information",
			inputSchema: {
				type: "object",
				properties: {},
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
			const query = `
				SELECT 
					pid,
					usename,
					application_name,
					client_addr,
					client_port,
					state,
					query_start,
					state_change,
					wait_event_type,
					wait_event,
					query
				FROM pg_stat_activity
				WHERE datname = current_database()
				ORDER BY query_start DESC
			`;

			const connections = await this.executor.executeQuery(query);

			return this.success(
				{
					connections,
					count: connections.length,
				},
				{
					tool: "postgresql_connections",
					count: connections.length,
				}
			);
		} catch (error) {
			this.logger.error("PostgreSQL connections query failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL connections query failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






