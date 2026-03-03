/**
 * PostgreSQL active queries tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLActiveQueriesTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_active_queries",
			description: "Show currently active/running queries with details",
			inputSchema: {
				type: "object",
				properties: {
					include_idle: {
						type: "boolean",
						default: false,
						description: "Include idle queries",
					},
					limit: {
						type: "number",
						default: 100,
						minimum: 1,
						maximum: 1000,
						description: "Maximum number of queries to return",
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

		const includeIdle = params.include_idle === true;
		const limit = params.limit || 100;

		try {
			let query: string;
			const queryParams: any[] = [limit];

			if (includeIdle) {
				query = `
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
						left(query, 500) AS query_preview,
						query
					FROM pg_stat_activity
					WHERE datname = current_database()
					ORDER BY query_start DESC NULLS LAST
					LIMIT $1
				`;
			} else {
				query = `
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
						left(query, 500) AS query_preview,
						query
					FROM pg_stat_activity
					WHERE datname = current_database()
						AND state != 'idle'
					ORDER BY query_start DESC NULLS LAST
					LIMIT $1
				`;
			}

			const queries = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL active queries retrieved", {
				count: queries.length,
				include_idle: includeIdle,
			});

			return this.success(
				{
					queries,
					count: queries.length,
				},
				{ tool: "postgresql_active_queries" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL active queries query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL active queries query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








