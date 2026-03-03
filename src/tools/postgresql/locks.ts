/**
 * PostgreSQL locks tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLLocksTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_locks",
			description: "Get PostgreSQL lock information",
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
					locktype,
					database,
					relation,
					page,
					tuple,
					virtualxid,
					transactionid,
					classid,
					objid,
					objsubid,
					virtualtransaction,
					pid,
					mode,
					granted
				FROM pg_locks
				WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
				ORDER BY pid, locktype
			`;

			const locks = await this.executor.executeQuery(query);

			return this.success(
				{
					locks,
					count: locks.length,
				},
				{
					tool: "postgresql_locks",
					count: locks.length,
				}
			);
		} catch (error) {
			this.logger.error("PostgreSQL locks query failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL locks query failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






