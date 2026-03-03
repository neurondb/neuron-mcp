/**
 * PostgreSQL replication tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLReplicationTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_replication",
			description: "Get PostgreSQL replication status",
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
					state,
					sent_lsn,
					write_lsn,
					flush_lsn,
					replay_lsn,
					sync_priority,
					sync_state
				FROM pg_stat_replication
			`;

			const replication = await this.executor.executeQuery(query);

			return this.success(
				{
					replication,
					count: replication.length,
				},
				{
					tool: "postgresql_replication",
					count: replication.length,
				}
			);
		} catch (error) {
			this.logger.error("PostgreSQL replication query failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL replication query failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






