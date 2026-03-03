/**
 * PostgreSQL functions tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLFunctionsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_functions",
			description: "List all PostgreSQL functions with parameters and return types",
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
						description: "Include system functions (pg_catalog)",
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

		try {
			let query: string;
			const queryParams: any[] = [];

			if (schema) {
				query = `
					SELECT 
						n.nspname AS schema_name,
						p.proname AS function_name,
						pg_get_function_identity_arguments(p.oid) AS arguments,
						pg_get_function_result(p.oid) AS return_type,
						pg_get_functiondef(p.oid) AS definition,
						COALESCE(r.rolname, 'public') AS owner,
						CASE p.prokind
							WHEN 'f' THEN 'function'
							WHEN 'p' THEN 'procedure'
							WHEN 'a' THEN 'aggregate'
							WHEN 'w' THEN 'window'
							ELSE 'unknown'
						END AS function_kind,
						p.provolatile AS volatility,
						p.proisstrict AS is_strict,
						p.prosecdef AS security_definer
					FROM pg_proc p
					JOIN pg_namespace n ON n.oid = p.pronamespace
					LEFT JOIN pg_roles r ON p.proowner = r.oid
					WHERE n.nspname = $1
					ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
				`;
				queryParams.push(schema);
			} else if (includeSystem) {
				query = `
					SELECT 
						n.nspname AS schema_name,
						p.proname AS function_name,
						pg_get_function_identity_arguments(p.oid) AS arguments,
						pg_get_function_result(p.oid) AS return_type,
						pg_get_functiondef(p.oid) AS definition,
						COALESCE(r.rolname, 'public') AS owner,
						CASE p.prokind
							WHEN 'f' THEN 'function'
							WHEN 'p' THEN 'procedure'
							WHEN 'a' THEN 'aggregate'
							WHEN 'w' THEN 'window'
							ELSE 'unknown'
						END AS function_kind,
						p.provolatile AS volatility,
						p.proisstrict AS is_strict,
						p.prosecdef AS security_definer
					FROM pg_proc p
					JOIN pg_namespace n ON n.oid = p.pronamespace
					LEFT JOIN pg_roles r ON p.proowner = r.oid
					ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
				`;
			} else {
				query = `
					SELECT 
						n.nspname AS schema_name,
						p.proname AS function_name,
						pg_get_function_identity_arguments(p.oid) AS arguments,
						pg_get_function_result(p.oid) AS return_type,
						pg_get_functiondef(p.oid) AS definition,
						COALESCE(r.rolname, 'public') AS owner,
						CASE p.prokind
							WHEN 'f' THEN 'function'
							WHEN 'p' THEN 'procedure'
							WHEN 'a' THEN 'aggregate'
							WHEN 'w' THEN 'window'
							ELSE 'unknown'
						END AS function_kind,
						p.provolatile AS volatility,
						p.proisstrict AS is_strict,
						p.prosecdef AS security_definer
					FROM pg_proc p
					JOIN pg_namespace n ON n.oid = p.pronamespace
					LEFT JOIN pg_roles r ON p.proowner = r.oid
					WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
					ORDER BY n.nspname, p.proname, pg_get_function_identity_arguments(p.oid)
				`;
			}

			const functions = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL functions listed", {
				count: functions.length,
				schema,
				include_system: includeSystem,
			});

			return this.success(
				{
					functions,
					count: functions.length,
				},
				{ tool: "postgresql_functions" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL functions query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL functions query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








