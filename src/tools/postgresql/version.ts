/**
 * PostgreSQL version tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLVersionTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_version",
			description: "Get PostgreSQL server version and build information",
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
			const versionQuery = `
				SELECT 
					version() AS version,
					pg_version() AS pg_version,
					current_setting('server_version') AS server_version,
					current_setting('server_version_num')::bigint AS server_version_num,
					current_setting('server_version_num')::bigint / 10000 AS major_version,
					(current_setting('server_version_num')::bigint / 100) % 100 AS minor_version,
					current_setting('server_version_num')::bigint % 100 AS patch_version
			`;

			const result = await this.executor.executeQueryOne(versionQuery);
			if (!result) {
				return this.error("Failed to retrieve PostgreSQL version", "QUERY_ERROR");
			}

			this.logger.info("PostgreSQL version retrieved", {
				server_version: result.server_version,
				major_version: result.major_version,
				minor_version: result.minor_version,
			});

			return this.success(result, { tool: "postgresql_version" });
		} catch (error) {
			this.logger.error("PostgreSQL version query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL version query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






