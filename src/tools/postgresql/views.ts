/**
 * PostgreSQL views tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLViewsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_views",
			description: "List all PostgreSQL views with definitions",
			inputSchema: {
				type: "object",
				properties: {
					schema: {
						type: "string",
						description: "Filter by schema name (optional)",
					},
					include_system: {
						type: "boolean",
						default: false,
						description: "Include system views (pg_catalog, information_schema)",
					},
					include_definition: {
						type: "boolean",
						default: true,
						description: "Include view definition SQL",
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
		const includeSystem = params.include_system === true;
		const includeDefinition = params.include_definition !== false;

		try {
			let query: string;
			const queryParams: any[] = [];

			if (includeDefinition) {
				if (schema) {
					query = `
						SELECT 
							table_schema AS schema_name,
							table_name AS view_name,
							view_definition,
							tableowner AS owner
						FROM information_schema.views v
						LEFT JOIN pg_tables t ON t.schemaname = v.table_schema AND t.tablename = v.table_name
						WHERE table_schema = $1
						ORDER BY table_schema, table_name
					`;
					queryParams.push(schema);
				} else if (includeSystem) {
					query = `
						SELECT 
							table_schema AS schema_name,
							table_name AS view_name,
							view_definition,
							COALESCE(t.tableowner, r.rolname) AS owner
						FROM information_schema.views v
						LEFT JOIN pg_tables t ON t.schemaname = v.table_schema AND t.tablename = v.table_name
						LEFT JOIN pg_class c ON c.relname = v.table_name
						LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = v.table_schema
						LEFT JOIN pg_roles r ON c.relowner = r.oid
						ORDER BY table_schema, table_name
					`;
				} else {
					query = `
						SELECT 
							table_schema AS schema_name,
							table_name AS view_name,
							view_definition,
							COALESCE(t.tableowner, r.rolname) AS owner
						FROM information_schema.views v
						LEFT JOIN pg_tables t ON t.schemaname = v.table_schema AND t.tablename = v.table_name
						LEFT JOIN pg_class c ON c.relname = v.table_name
						LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = v.table_schema
						LEFT JOIN pg_roles r ON c.relowner = r.oid
						WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
						ORDER BY table_schema, table_name
					`;
				}
			} else {
				if (schema) {
					query = `
						SELECT 
							table_schema AS schema_name,
							table_name AS view_name,
							COALESCE(t.tableowner, r.rolname) AS owner
						FROM information_schema.views v
						LEFT JOIN pg_tables t ON t.schemaname = v.table_schema AND t.tablename = v.table_name
						LEFT JOIN pg_class c ON c.relname = v.table_name
						LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = v.table_schema
						LEFT JOIN pg_roles r ON c.relowner = r.oid
						WHERE table_schema = $1
						ORDER BY table_schema, table_name
					`;
					queryParams.push(schema);
				} else if (includeSystem) {
					query = `
						SELECT 
							table_schema AS schema_name,
							table_name AS view_name,
							COALESCE(t.tableowner, r.rolname) AS owner
						FROM information_schema.views v
						LEFT JOIN pg_tables t ON t.schemaname = v.table_schema AND t.tablename = v.table_name
						LEFT JOIN pg_class c ON c.relname = v.table_name
						LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = v.table_schema
						LEFT JOIN pg_roles r ON c.relowner = r.oid
						ORDER BY table_schema, table_name
					`;
				} else {
					query = `
						SELECT 
							table_schema AS schema_name,
							table_name AS view_name,
							COALESCE(t.tableowner, r.rolname) AS owner
						FROM information_schema.views v
						LEFT JOIN pg_tables t ON t.schemaname = v.table_schema AND t.tablename = v.table_name
						LEFT JOIN pg_class c ON c.relname = v.table_name
						LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = v.table_schema
						LEFT JOIN pg_roles r ON c.relowner = r.oid
						WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
						ORDER BY table_schema, table_name
					`;
				}
			}

			const views = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL views listed", {
				count: views.length,
				schema,
				include_system: includeSystem,
				include_definition: includeDefinition,
			});

			return this.success(
				{
					views,
					count: views.length,
				},
				{ tool: "postgresql_views" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL views query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL views query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}







