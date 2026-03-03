/**
 * PostgreSQL schemas tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLSchemasTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_schemas",
			description: "List all PostgreSQL schemas with ownership and permissions",
			inputSchema: {
				type: "object",
				properties: {
					include_system: {
						type: "boolean",
						default: false,
						description: "Include system schemas (pg_catalog, information_schema, pg_toast)",
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
						n.nspname AS schema_name,
						COALESCE(r.rolname, 'public') AS owner,
						n.nspacl AS permissions,
						pg_catalog.obj_description(n.oid, 'pg_namespace') AS description
					FROM pg_namespace n
					LEFT JOIN pg_roles r ON n.nspowner = r.oid
					ORDER BY n.nspname
				`;
			} else {
				query = `
					SELECT 
						n.nspname AS schema_name,
						COALESCE(r.rolname, 'public') AS owner,
						n.nspacl AS permissions,
						pg_catalog.obj_description(n.oid, 'pg_namespace') AS description
					FROM pg_namespace n
					LEFT JOIN pg_roles r ON n.nspowner = r.oid
					WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
						AND n.nspname NOT LIKE 'pg_temp_%'
						AND n.nspname NOT LIKE 'pg_toast_temp_%'
					ORDER BY n.nspname
				`;
			}

			const schemas = await this.executor.executeQuery(query);

			this.logger.info("PostgreSQL schemas listed", {
				count: schemas.length,
				include_system: includeSystem,
			});

			return this.success(
				{
					schemas,
					count: schemas.length,
				},
				{ tool: "postgresql_schemas" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL schemas query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL schemas query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








