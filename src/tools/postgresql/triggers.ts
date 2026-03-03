/**
 * PostgreSQL triggers tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLTriggersTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_triggers",
			description: "List all PostgreSQL triggers with event types and functions",
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

		try {
			let query: string;
			const queryParams: any[] = [];
			const conditions: string[] = [];

			if (schema) {
				conditions.push(`n.nspname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			}
			if (table) {
				conditions.push(`c.relname = $${queryParams.length + 1}`);
				queryParams.push(table);
			}

			const additionalConditions = conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

			query = `
				SELECT 
					n.nspname AS schema_name,
					c.relname AS table_name,
					t.tgname AS trigger_name,
					pg_get_triggerdef(t.oid) AS trigger_definition,
					CASE t.tgtype & cast(2 as int2)
						WHEN 0 THEN 'ROW'
						ELSE 'STATEMENT'
					END AS trigger_level,
					CASE
						WHEN t.tgtype & cast(4 as int2) != 0 THEN 'BEFORE'
						WHEN t.tgtype & cast(64 as int2) != 0 THEN 'INSTEAD OF'
						ELSE 'AFTER'
					END AS trigger_timing,
					CASE
						WHEN t.tgtype & cast(8 as int2) != 0 THEN 'INSERT'
						WHEN t.tgtype & cast(16 as int2) != 0 THEN 'DELETE'
						WHEN t.tgtype & cast(32 as int2) != 0 THEN 'UPDATE'
						ELSE 'UNKNOWN'
					END AS trigger_event,
					p.proname AS function_name,
					t.tgenabled AS is_enabled
				FROM pg_trigger t
				JOIN pg_class c ON c.oid = t.tgrelid
				JOIN pg_namespace n ON n.oid = c.relnamespace
				JOIN pg_proc p ON p.oid = t.tgfoid
				WHERE NOT t.tgisinternal
				${additionalConditions}
				ORDER BY n.nspname, c.relname, t.tgname
			`;

			const triggers = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL triggers listed", {
				count: triggers.length,
				schema,
				table,
			});

			return this.success(
				{
					triggers,
					count: triggers.length,
				},
				{ tool: "postgresql_triggers" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL triggers query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL triggers query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}

