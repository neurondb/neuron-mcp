/**
 * PostgreSQL users tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLUsersTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_users",
			description: "List all PostgreSQL users with login and connection info",
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
					u.usename AS username,
					u.usesysid AS user_id,
					u.usecreatedb AS can_create_db,
					u.usesuper AS is_superuser,
					u.userepl AS can_replicate,
					u.usebypassrls AS can_bypass_rls,
					u.valuntil AS password_expires_at,
					(SELECT count(*) FROM pg_stat_activity WHERE usename = u.usename) AS active_connections
				FROM pg_user u
				ORDER BY u.usename
			`;

			const users = await this.executor.executeQuery(query);

			this.logger.info("PostgreSQL users listed", {
				count: users.length,
			});

			return this.success(
				{
					users,
					count: users.length,
				},
				{ tool: "postgresql_users" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL users query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL users query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








