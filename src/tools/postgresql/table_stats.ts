/**
 * PostgreSQL table statistics tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLTableStatsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_table_stats",
			description: "Get detailed per-table statistics (scans, inserts, updates, deletes, tuples)",
			inputSchema: {
				type: "object",
				properties: {
					schema: {
						type: "string",
						description: "Filter by schema name (optional)",
					},
					table: {
						type: "string",
						description: "Filter by table name (optional)",
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

		const schema = params.schema as string | undefined;
		const table = params.table as string | undefined;

		try {
			let query: string;
			const queryParams: any[] = [];
			const conditions: string[] = [];

			if (schema) {
				conditions.push(`s.schemaname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			}
			if (table) {
				conditions.push(`s.relname = $${queryParams.length + 1}`);
				queryParams.push(table);
			}

			const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

			query = `
				SELECT 
					s.schemaname,
					s.relname AS table_name,
					s.seq_scan AS sequential_scans,
					s.seq_tup_read AS seq_tuples_read,
					s.idx_scan AS index_scans,
					s.idx_tup_fetch AS index_tuples_fetched,
					s.n_tup_ins AS inserts,
					s.n_tup_upd AS updates,
					s.n_tup_del AS deletes,
					s.n_tup_hot_upd AS hot_updates,
					s.n_live_tup AS live_tuples,
					s.n_dead_tup AS dead_tuples,
					CASE 
						WHEN s.n_live_tup > 0 THEN (s.n_dead_tup::float / s.n_live_tup * 100)
						ELSE 0
					END AS dead_tuple_percent,
					s.n_mod_since_analyze AS modifications_since_analyze,
					s.last_vacuum,
					s.last_autovacuum,
					s.last_analyze,
					s.last_autoanalyze,
					s.vacuum_count,
					s.autovacuum_count,
					s.analyze_count,
					s.autoanalyze_count,
					pg_total_relation_size(s.schemaname||'.'||s.relname) AS total_size_bytes,
					pg_size_pretty(pg_total_relation_size(s.schemaname||'.'||s.relname)) AS total_size_pretty,
					pg_relation_size(s.schemaname||'.'||s.relname) AS table_size_bytes,
					pg_size_pretty(pg_relation_size(s.schemaname||'.'||s.relname)) AS table_size_pretty
				FROM pg_stat_user_tables s
				${whereClause}
				ORDER BY s.schemaname, s.relname
			`;

			const stats = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL table statistics retrieved", {
				count: stats.length,
				schema,
				table,
			});

			return this.success(
				{
					table_stats: stats,
					count: stats.length,
				},
				{ tool: "postgresql_table_stats" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL table statistics query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL table statistics query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








