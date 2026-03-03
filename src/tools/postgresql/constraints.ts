/**
 * PostgreSQL constraints tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLConstraintsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_constraints",
			description: "List constraints (primary keys, foreign keys, unique, check)",
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
					constraint_type: {
						type: "string",
						enum: ["primary_key", "foreign_key", "unique", "check", "not_null"],
						description: "Filter by constraint type (optional)",
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
		const constraintType = params.constraint_type as string | undefined;

		try {
			const queryParams: any[] = [];
			const conditions: string[] = [];

			if (schema) {
				conditions.push(`n.nspname = $${queryParams.length + 1}`);
				queryParams.push(schema);
			}
			if (table) {
				conditions.push(`t.relname = $${queryParams.length + 1}`);
				queryParams.push(table);
			}

			if (constraintType) {
				switch (constraintType) {
					case "primary_key":
						conditions.push(`c.contype = 'p'`);
						break;
					case "foreign_key":
						conditions.push(`c.contype = 'f'`);
						break;
					case "unique":
						conditions.push(`c.contype = 'u'`);
						break;
					case "check":
						conditions.push(`c.contype = 'c'`);
						break;
					case "not_null":
						conditions.push(`c.contype = 'n'`);
						break;
				}
			}

			conditions.push(`n.nspname NOT IN ('pg_catalog', 'information_schema')`);

			const whereClause = `WHERE ${conditions.join(" AND ")}`;

			const query = `
				SELECT 
					n.nspname AS schema_name,
					t.relname AS table_name,
					c.conname AS constraint_name,
					CASE c.contype
						WHEN 'p' THEN 'primary_key'
						WHEN 'f' THEN 'foreign_key'
						WHEN 'u' THEN 'unique'
						WHEN 'c' THEN 'check'
						WHEN 'n' THEN 'not_null'
						ELSE 'unknown'
					END AS constraint_type,
					pg_get_constraintdef(c.oid) AS constraint_definition,
					CASE 
						WHEN c.contype = 'f' THEN
							(SELECT n2.nspname||'.'||t2.relname 
							 FROM pg_class t2 
							 JOIN pg_namespace n2 ON n2.oid = t2.relnamespace
							 WHERE t2.oid = c.confrelid)
						ELSE NULL
					END AS foreign_table
				FROM pg_constraint c
				JOIN pg_class t ON t.oid = c.conrelid
				JOIN pg_namespace n ON n.oid = t.relnamespace
				${whereClause}
				ORDER BY n.nspname, t.relname, c.conname
			`;

			const constraints = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL constraints listed", {
				count: constraints.length,
				schema,
				table,
				constraint_type: constraintType,
			});

			return this.success(
				{
					constraints,
					count: constraints.length,
				},
				{ tool: "postgresql_constraints" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL constraints query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL constraints query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}








