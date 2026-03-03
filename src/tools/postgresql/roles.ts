/**
 * PostgreSQL roles tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLRolesTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_roles",
			description: "List all PostgreSQL roles with membership and attributes",
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
					r.rolname AS role_name,
					r.oid AS role_id,
					r.rolsuper AS is_superuser,
					r.rolinherit AS can_inherit,
					r.rolcreaterole AS can_create_roles,
					r.rolcreatedb AS can_create_db,
					r.rolcanlogin AS can_login,
					r.rolreplication AS can_replicate,
					r.rolbypassrls AS can_bypass_rls,
					r.rolconnlimit AS connection_limit,
					r.rolvaliduntil AS password_expires_at,
					COALESCE(
						(SELECT json_agg(json_build_object(
							'member', m.rolname,
							'admin_option', am.admin_option
						))
						FROM pg_auth_members am
						JOIN pg_roles m ON m.oid = am.member
						WHERE am.roleid = r.oid), 
						'[]'::json
					) AS members,
					COALESCE(
						(SELECT json_agg(m.rolname)
						FROM pg_auth_members am
						JOIN pg_roles m ON m.oid = am.roleid
						WHERE am.member = r.oid),
						'[]'::json
					) AS member_of
				FROM pg_roles r
				ORDER BY r.rolname
			`;

			const roles = await this.executor.executeQuery(query);

			this.logger.info("PostgreSQL roles listed", {
				count: roles.length,
			});

			return this.success(
				{
					roles,
					count: roles.length,
				},
				{ tool: "postgresql_roles" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL roles query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL roles query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








