/**
 * PostgreSQL permissions tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLPermissionsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_permissions",
			description: "List database object permissions (tables, functions, etc.)",
			inputSchema: {
				type: "object",
				properties: {
					schema: {
						type: "string",
						description: "Filter by schema name (optional)",
					},
					object_type: {
						type: "string",
						enum: ["table", "function", "sequence", "schema"],
						description: "Filter by object type (optional)",
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
		const objectType = params.object_type as string | undefined;

		try {
			const queryParams: any[] = [];
			const conditions: string[] = [];

			if (schema) {
				conditions.push(`n.nspname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			}

			let typeFilter = "";
			if (objectType) {
				switch (objectType) {
					case "table":
						typeFilter = "AND c.relkind IN ('r', 'v', 'm')";
						break;
					case "function":
						typeFilter = "AND c.relkind = 'f'";
						break;
					case "sequence":
						typeFilter = "AND c.relkind = 'S'";
						break;
					case "schema":
						// Handle schema permissions separately
						break;
				}
			} else {
				typeFilter = "AND c.relkind IN ('r', 'v', 'm', 'S')";
			}

			let query: string;
			if (objectType === "schema") {
				query = `
					SELECT 
						n.nspname AS object_name,
						'schema' AS object_type,
						n.nspacl AS permissions
					FROM pg_namespace n
					WHERE 1=1
					${conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : ""}
					ORDER BY n.nspname
				`;
			} else {
				query = `
					SELECT 
						n.nspname AS schema_name,
						c.relname AS object_name,
						CASE c.relkind
							WHEN 'r' THEN 'table'
							WHEN 'v' THEN 'view'
							WHEN 'm' THEN 'materialized_view'
							WHEN 'S' THEN 'sequence'
							WHEN 'f' THEN 'function'
							ELSE 'unknown'
						END AS object_type,
						c.relacl AS permissions
					FROM pg_class c
					JOIN pg_namespace n ON n.oid = c.relnamespace
					WHERE 1=1
					${typeFilter}
					${conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : ""}
					ORDER BY n.nspname, c.relname
				`;
			}

			const permissions = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL permissions listed", {
				count: permissions.length,
				schema,
				object_type: objectType,
			});

			return this.success(
				{
					permissions,
					count: permissions.length,
				},
				{ tool: "postgresql_permissions" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL permissions query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL permissions query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








