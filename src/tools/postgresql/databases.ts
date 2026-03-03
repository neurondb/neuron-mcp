/**
 * PostgreSQL database list tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLDatabaseListTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_databases",
			description: "List all PostgreSQL databases with their sizes and connection counts",
			inputSchema: {
				type: "object",
				properties: {
					include_system: {
						type: "boolean",
						default: false,
						description: "Include system databases (template0, template1, postgres)",
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

		const includeSystem = params.include_system === true;

		try {
			let query: string;
			if (includeSystem) {
				query = `
					SELECT 
						datname AS name,
						pg_database_size(datname) AS size_bytes,
						pg_size_pretty(pg_database_size(datname)) AS size_pretty,
						numbackends AS connections,
						datcollate AS collation,
						datctype AS ctype
					FROM pg_database d
					LEFT JOIN pg_stat_database s ON d.oid = s.datid
					ORDER BY pg_database_size(datname) DESC
				`;
			} else {
				query = `
					SELECT 
						datname AS name,
						pg_database_size(datname) AS size_bytes,
						pg_size_pretty(pg_database_size(datname)) AS size_pretty,
						numbackends AS connections,
						datcollate AS collation,
						datctype AS ctype
					FROM pg_database d
					LEFT JOIN pg_stat_database s ON d.oid = s.datid
					WHERE datname NOT IN ('template0', 'template1', 'postgres')
					ORDER BY pg_database_size(datname) DESC
				`;
			}

			const databases = await this.executor.executeQuery(query);

			this.logger.info("PostgreSQL databases listed", {
				count: databases.length,
				include_system: includeSystem,
			});

			return this.success(
				{
					databases,
					count: databases.length,
				},
				{ tool: "postgresql_databases" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL database list query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL database list query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






