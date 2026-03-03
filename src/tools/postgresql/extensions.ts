/**
 * PostgreSQL extensions tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLExtensionsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_extensions",
			description: "List installed PostgreSQL extensions",
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
					extname,
					extversion,
					nspname AS schema,
					extrelocatable,
					extconfig
				FROM pg_extension e
				JOIN pg_namespace n ON e.extnamespace = n.oid
				ORDER BY extname
			`;

			const extensions = await this.executor.executeQuery(query);

			return this.success(
				{
					extensions,
					count: extensions.length,
				},
				{
					tool: "postgresql_extensions",
					count: extensions.length,
				}
			);
		} catch (error) {
			this.logger.error("PostgreSQL extensions query failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL extensions query failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}






