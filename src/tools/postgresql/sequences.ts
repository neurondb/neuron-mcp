/**
 * PostgreSQL sequences tool
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class PostgreSQLSequencesTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "postgresql_sequences",
			description: "List all PostgreSQL sequences with current values and ranges",
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
						description: "Include system sequences (pg_catalog)",
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
						c.relname AS sequence_name,
						COALESCE(r.rolname, 'public') AS owner,
						s.seqstart AS start_value,
						s.seqmin AS min_value,
						s.seqmax AS max_value,
						s.seqincrement AS increment_by,
						s.seqcycle AS is_cycled,
						s.seqcache AS cache_size,
						COALESCE(last_value, s.seqstart) AS last_value
					FROM pg_sequence s
					JOIN pg_class c ON c.oid = s.seqrelid
					JOIN pg_namespace n ON n.oid = c.relnamespace
					LEFT JOIN pg_roles r ON c.relowner = r.oid
					LEFT JOIN LATERAL (
						SELECT last_value FROM pg_catalog.pg_sequence_last_value(c.oid::regclass)
					) lv ON true
					WHERE n.nspname = $1
					ORDER BY n.nspname, c.relname
				`;
				queryParams.push(schema);
			} else if (includeSystem) {
				query = `
					SELECT 
						n.nspname AS schema_name,
						c.relname AS sequence_name,
						COALESCE(r.rolname, 'public') AS owner,
						s.seqstart AS start_value,
						s.seqmin AS min_value,
						s.seqmax AS max_value,
						s.seqincrement AS increment_by,
						s.seqcycle AS is_cycled,
						s.seqcache AS cache_size,
						COALESCE(last_value, s.seqstart) AS last_value
					FROM pg_sequence s
					JOIN pg_class c ON c.oid = s.seqrelid
					JOIN pg_namespace n ON n.oid = c.relnamespace
					LEFT JOIN pg_roles r ON c.relowner = r.oid
					LEFT JOIN LATERAL (
						SELECT last_value FROM pg_catalog.pg_sequence_last_value(c.oid::regclass)
					) lv ON true
					ORDER BY n.nspname, c.relname
				`;
			} else {
				query = `
					SELECT 
						n.nspname AS schema_name,
						c.relname AS sequence_name,
						COALESCE(r.rolname, 'public') AS owner,
						s.seqstart AS start_value,
						s.seqmin AS min_value,
						s.seqmax AS max_value,
						s.seqincrement AS increment_by,
						s.seqcycle AS is_cycled,
						s.seqcache AS cache_size,
						COALESCE(last_value, s.seqstart) AS last_value
					FROM pg_sequence s
					JOIN pg_class c ON c.oid = s.seqrelid
					JOIN pg_namespace n ON n.oid = c.relnamespace
					LEFT JOIN pg_roles r ON c.relowner = r.oid
					LEFT JOIN LATERAL (
						SELECT last_value FROM pg_catalog.pg_sequence_last_value(c.oid::regclass)
					) lv ON true
					WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
					ORDER BY n.nspname, c.relname
				`;
			}

			const sequences = await this.executor.executeQuery(query, queryParams);

			this.logger.info("PostgreSQL sequences listed", {
				count: sequences.length,
				schema,
				include_system: includeSystem,
			});

			return this.success(
				{
					sequences,
					count: sequences.length,
				},
				{ tool: "postgresql_sequences" }
			);
		} catch (error) {
			this.logger.error("PostgreSQL sequences query execution failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "PostgreSQL sequences query execution failed",
				"QUERY_ERROR",
				{ error: error instanceof Error ? error.message : String(error) }
			);
		}
	}
}

