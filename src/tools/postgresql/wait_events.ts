/**
 * PostgreSQL wait events tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLWaitEventsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_wait_events",
			description: "Show wait events and blocking queries",
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
					state,
					wait_event_type,
					wait_event,
					query_start,
					state_change,
					left(query, 500) AS query_preview,
					(
						SELECT json_agg(json_build_object(
							'blocked_pid', blocked_locks.pid,
							'blocking_pid', blocking_locks.pid,
							'blocked_query', left(blocked_activity.query, 200),
							'blocking_query', left(blocking_activity.query, 200)
						))
						FROM pg_catalog.pg_locks blocked_locks
						JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
						JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
							AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
							AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
							AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
							AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
							AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
							AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
							AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
							AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
							AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
							AND blocking_locks.pid != blocked_locks.pid
						JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
						WHERE NOT blocked_locks.granted
							AND blocked_activity.pid = a.pid
					) AS blocking_info
				FROM pg_stat_activity a
				WHERE datname = current_database()
					AND wait_event_type IS NOT NULL
				ORDER BY query_start DESC NULLS LAST
			`;

			const waitEvents = await this.executor.executeQuery(query);

			this.logger.info("PostgreSQL wait events retrieved", {
				count: waitEvents.length,
			});

			return this.success(
				{
					wait_events: waitEvents,
					count: waitEvents.length,
				},
				{ tool: "postgresql_wait_events" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL wait events query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL wait events query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








