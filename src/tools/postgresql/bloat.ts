/**
 * PostgreSQL bloat tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLBloatTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_bloat",
			description: "Check table and index bloat (estimated)",
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
					min_bloat_percent: {
						type: "number",
						default: 10,
						minimum: 0,
						maximum: 100,
						description: "Minimum bloat percentage to report (0-100)",
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
		const minBloatPercent = params.min_bloat_percent || 10;

		try {
			const queryParams: any[] = [minBloatPercent];
			const conditions: string[] = [];

			if (schema) {
				conditions.push(`n.nspname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			}
			if (table) {
				conditions.push(`t.relname = $${queryParams.length + 1}`);
				queryParams.push(table);
			}

			conditions.push(`n.nspname NOT IN ('pg_catalog', 'information_schema')`);
			conditions.push(`c.relkind = 'r'`); // Only regular tables

			// Estimated bloat calculation based on pg_stat_user_tables and table sizes
			// Add bloat threshold condition to WHERE clause
			conditions.push(`(
				CASE 
					WHEN COALESCE(s.n_live_tup, 0) > 0 
					THEN (s.n_dead_tup::float / NULLIF(s.n_live_tup, 0) * 100)
					ELSE 0
				END >= $1
				OR
				CASE 
					WHEN COALESCE(s.n_live_tup, 0) > 0 AND pg_relation_size(c.oid) > 0
					THEN (
						(pg_relation_size(c.oid) - 
						 (COALESCE(s.n_live_tup, 0) * 
						  COALESCE((pg_relation_size(c.oid)::float / NULLIF(COALESCE(s.n_live_tup, 0) + COALESCE(s.n_dead_tup, 0), 0)), 0)))
						/ NULLIF(pg_relation_size(c.oid), 0) * 100
					)
					ELSE 0
				END >= $1
			)`);
			const whereClause = `WHERE ${conditions.join(" AND ")}`;

			const query = `
				SELECT 
					n.nspname AS schema_name,
					c.relname AS table_name,
					pg_total_relation_size(c.oid) AS total_size_bytes,
					pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size_pretty,
					COALESCE(s.n_live_tup, 0) AS live_tuples,
					COALESCE(s.n_dead_tup, 0) AS dead_tuples,
					CASE 
						WHEN COALESCE(s.n_live_tup, 0) > 0 
						THEN (s.n_dead_tup::float / NULLIF(s.n_live_tup, 0) * 100)
						ELSE 0
					END AS dead_tuple_percent,
					pg_relation_size(c.oid) AS table_size_bytes,
					pg_size_pretty(pg_relation_size(c.oid)) AS table_size_pretty,
					pg_indexes_size(c.oid) AS indexes_size_bytes,
					pg_size_pretty(pg_indexes_size(c.oid)) AS indexes_size_pretty,
					CASE 
						WHEN COALESCE(s.n_live_tup, 0) > 0 AND pg_relation_size(c.oid) > 0
						THEN (
							(pg_relation_size(c.oid) - 
							 (COALESCE(s.n_live_tup, 0) * 
							  COALESCE((pg_relation_size(c.oid)::float / NULLIF(COALESCE(s.n_live_tup, 0) + COALESCE(s.n_dead_tup, 0), 0)), 0)))
							/ NULLIF(pg_relation_size(c.oid), 0) * 100
						)
						ELSE 0
					END AS estimated_bloat_percent
				FROM pg_class c
				JOIN pg_namespace n ON n.oid = c.relnamespace
				LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
				${whereClause}
				ORDER BY estimated_bloat_percent DESC, dead_tuple_percent DESC
			`;

			const bloat = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL bloat checked", {
				count: bloat.length,
				schema,
				table,
				min_bloat_percent: minBloatPercent,
			});

			return this.success(
				{
					bloat,
					count: bloat.length,
				},
				{ tool: "postgresql_bloat" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL bloat query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL bloat query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}

