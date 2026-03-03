/**
 * PostgreSQL vacuum statistics tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLVacuumStatsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_vacuum_stats",
			description: "Get vacuum statistics and recommendations",
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

			const query = `
				SELECT 
					s.schemaname,
					s.relname AS table_name,
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
					COALESCE(EXTRACT(EPOCH FROM (now() - s.last_vacuum)), 
						EXTRACT(EPOCH FROM (now() - s.last_autovacuum))) AS seconds_since_vacuum,
					COALESCE(EXTRACT(EPOCH FROM (now() - s.last_analyze)), 
						EXTRACT(EPOCH FROM (now() - s.last_autoanalyze))) AS seconds_since_analyze,
					CASE 
						WHEN s.n_dead_tup > (s.n_live_tup * 0.2) THEN 'vacuum_recommended'
						WHEN s.n_mod_since_analyze > (s.n_live_tup * 0.1) THEN 'analyze_recommended'
						WHEN s.last_vacuum IS NULL AND s.last_autovacuum IS NULL THEN 'vacuum_recommended'
						WHEN s.last_analyze IS NULL AND s.last_autoanalyze IS NULL THEN 'analyze_recommended'
						ELSE 'ok'
					END AS recommendation,
					pg_size_pretty(pg_total_relation_size(s.schemaname||'.'||s.relname)) AS table_size
				FROM pg_stat_user_tables s
				${whereClause}
				ORDER BY 
					CASE 
						WHEN s.n_dead_tup > (s.n_live_tup * 0.2) THEN 1
						WHEN s.n_mod_since_analyze > (s.n_live_tup * 0.1) THEN 2
						ELSE 3
					END,
					s.n_dead_tup DESC
			`;

			const stats = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL vacuum statistics retrieved", {
				count: stats.length,
				schema,
				table,
			});

			return this.success(
				{
					vacuum_stats: stats,
					count: stats.length,
				},
				{ tool: "postgresql_vacuum_stats" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL vacuum statistics query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL vacuum statistics query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








