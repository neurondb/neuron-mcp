/**
 * Worker management tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class WorkerStatusTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "worker_status",
			description: "Get status of background workers",
			inputSchema: {
				type: "object",
				properties: {
					worker_id: { type: "number", description: "Specific worker ID (optional)" },
				},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		try {
			const { worker_id } = params;
			let query = `SELECT * FROM neurondb.neurondb_workers`;
			const queryParams: any[] = [];

			if (worker_id !== undefined) {
				query += ` WHERE worker_id = $1`;
				queryParams.push(worker_id);
			}

			query += ` ORDER BY worker_id`;

			const results = await this.executor.executeQuery(query, queryParams);
			return this.success(results, { count: results.length });
		} catch (error) {
			this.logger.error("Worker status failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Worker status failed", "WORKER_ERROR");
		}
	}
}





