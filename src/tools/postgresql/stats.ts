/**
 * PostgreSQL statistics tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLStatsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_stats",
			description: "Get comprehensive PostgreSQL server statistics including database size, connection info, table stats, and performance metrics",
			inputSchema: {
				type: "object",
				properties: {
					include_database_stats: {
						type: "boolean",
						default: true,
						description: "Include database-level statistics",
					},
					include_table_stats: {
						type: "boolean",
						default: true,
						description: "Include table statistics",
					},
					include_connection_stats: {
						type: "boolean",
						default: true,
						description: "Include connection statistics",
					},
					include_performance_stats: {
						type: "boolean",
						default: true,
						description: "Include performance metrics",
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

		const includeDBStats = params.include_database_stats !== false;
		const includeTableStats = params.include_table_stats !== false;
		const includeConnStats = params.include_connection_stats !== false;
		const includePerfStats = params.include_performance_stats !== false;

		const stats: Record<string, any> = {};

		try {
			// Database statistics
			if (includeDBStats) {
				const dbStatsQuery = `
					SELECT 
						current_database() AS current_database,
						pg_database_size(current_database()) AS database_size_bytes,
						pg_size_pretty(pg_database_size(current_database())) AS database_size_pretty,
						(SELECT count(*) FROM pg_database) AS total_databases,
						(SELECT count(*) FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema') AS user_schemas
				`;
				try {
					const dbStats = await this.executor.executeQueryOne(dbStatsQuery);
					if (dbStats) {
						stats.database = dbStats;
					}
				} catch (error) {
					this.logger.warn("Failed to get database stats", { error: error instanceof Error ? error.message : String(error) });
				}
			}

			// Connection statistics
			if (includeConnStats) {
				const connStatsQuery = `
					SELECT 
						(SELECT count(*) FROM pg_stat_activity WHERE state = 'active') AS active_connections,
						(SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') AS idle_connections,
						(SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction') AS idle_in_transaction,
						(SELECT count(*) FROM pg_stat_activity) AS total_connections,
						current_setting('max_connections')::int AS max_connections,
						(SELECT count(*) FROM pg_stat_activity)::float / NULLIF(current_setting('max_connections')::int, 0) * 100 AS connection_usage_percent
				`;
				try {
					const connStats = await this.executor.executeQueryOne(connStatsQuery);
					if (connStats) {
						stats.connections = connStats;
					}
				} catch (error) {
					this.logger.warn("Failed to get connection stats", { error: error instanceof Error ? error.message : String(error) });
				}
			}

			// Table statistics
			if (includeTableStats) {
				const tableStatsQuery = `
					SELECT 
						(SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')) AS user_tables,
						(SELECT count(*) FROM pg_tables) AS total_tables,
						(SELECT sum(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')) AS total_user_tables_size_bytes,
						(SELECT pg_size_pretty(sum(pg_total_relation_size(schemaname||'.'||tablename))) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')) AS total_user_tables_size_pretty,
						(SELECT count(*) FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog', 'information_schema')) AS user_indexes,
						(SELECT count(*) FROM pg_indexes) AS total_indexes
				`;
				try {
					const tableStats = await this.executor.executeQueryOne(tableStatsQuery);
					if (tableStats) {
						stats.tables = tableStats;
					}
				} catch (error) {
					this.logger.warn("Failed to get table stats", { error: error instanceof Error ? error.message : String(error) });
				}
			}

			// Performance statistics
			if (includePerfStats) {
				const perfStatsQuery = `
					SELECT 
						(SELECT sum(seq_scan) FROM pg_stat_user_tables) AS total_seq_scans,
						(SELECT sum(idx_scan) FROM pg_stat_user_tables) AS total_idx_scans,
						(SELECT sum(n_tup_ins) FROM pg_stat_user_tables) AS total_inserts,
						(SELECT sum(n_tup_upd) FROM pg_stat_user_tables) AS total_updates,
						(SELECT sum(n_tup_del) FROM pg_stat_user_tables) AS total_deletes,
						(SELECT sum(n_live_tup) FROM pg_stat_user_tables) AS total_live_tuples,
						(SELECT sum(n_dead_tup) FROM pg_stat_user_tables) AS total_dead_tuples,
						(SELECT sum(n_dead_tup)::float / NULLIF(sum(n_live_tup), 0) * 100 FROM pg_stat_user_tables) AS dead_tuple_percent,
						(SELECT count(*) FROM pg_stat_user_tables WHERE last_vacuum IS NOT NULL) AS tables_vacuumed,
						(SELECT count(*) FROM pg_stat_user_tables WHERE last_analyze IS NOT NULL) AS tables_analyzed
				`;
				try {
					const perfStats = await this.executor.executeQueryOne(perfStatsQuery);
					if (perfStats) {
						stats.performance = perfStats;
					}

					// Cache hit ratio
					const cacheQuery = `
						SELECT 
							sum(heap_blks_hit)::float / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100 AS heap_cache_hit_ratio,
							sum(idx_blks_hit)::float / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0) * 100 AS index_cache_hit_ratio
						FROM pg_statio_user_tables
					`;
					try {
						const cacheStats = await this.executor.executeQueryOne(cacheQuery);
						if (cacheStats && stats.performance) {
							stats.performance = { ...stats.performance, ...cacheStats };
						}
					} catch (error) {
						// Ignore cache stats errors
					}
				} catch (error) {
					this.logger.warn("Failed to get performance stats", { error: error instanceof Error ? error.message : String(error) });
				}
			}

			// Server information
			const serverInfoQuery = `
				SELECT 
					current_setting('server_version') AS server_version,
					current_setting('shared_buffers') AS shared_buffers,
					current_setting('effective_cache_size') AS effective_cache_size,
					current_setting('work_mem') AS work_mem,
					current_setting('maintenance_work_mem') AS maintenance_work_mem,
					current_setting('max_connections') AS max_connections,
					current_setting('checkpoint_timeout') AS checkpoint_timeout,
					pg_postmaster_start_time() AS server_start_time,
					now() - pg_postmaster_start_time() AS server_uptime
			`;
			try {
				const serverInfo = await this.executor.executeQueryOne(serverInfoQuery);
				if (serverInfo) {
					stats.server = serverInfo;
				}
			} catch (error) {
				this.logger.warn("Failed to get server info", { error: error instanceof Error ? error.message : String(error) });
			}

			this.logger.info("PostgreSQL statistics retrieved", {
				include_database_stats: includeDBStats,
				include_table_stats: includeTableStats,
				include_connection_stats: includeConnStats,
				include_performance_stats: includePerfStats,
			});

			return this.success(stats, { tool: "postgresql_stats" });
		} catch (error) {
			this.logger.error("PostgreSQL statistics query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL statistics query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






