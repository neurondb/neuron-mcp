/**
 * Reranking tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class RerankCrossEncoderTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "rerank_cross_encoder",
			description: "Rerank documents using cross-encoder model",
			inputSchema: {
				type: "object",
				properties: {
					query: { type: "string", description: "Query text" },
					documents: {
						type: "array",
						items: { type: "string" },
						description: "Documents to rerank",
					},
					model: { type: "string", default: "cross-encoder/ms-marco-MiniLM-L-6-v2" },
					top_k: { type: "number", default: 10, minimum: 1 },
				},
				required: ["query", "documents"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { query, documents, model = "cross-encoder/ms-marco-MiniLM-L-6-v2", top_k = 10 } = params;
			const query_sql = `SELECT rerank_cross_encoder($1, $2, $3, $4) AS results`;
			const result = await this.executor.executeQueryOne(query_sql, [query, documents, model, top_k]);
			return this.success(result, { model, top_k, count: documents.length });
		} catch (error) {
			this.logger.error("Cross-encoder reranking failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Cross-encoder reranking failed",
				"RERANKING_ERROR"
			);
		}
	}
}

export class RerankFlashTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "rerank_flash",
			description: "Rerank documents using flash reranking (fast)",
			inputSchema: {
				type: "object",
				properties: {
					query: { type: "string" },
					documents: { type: "array", items: { type: "string" } },
					top_k: { type: "number", default: 10 },
				},
				required: ["query", "documents"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { query, documents, top_k = 10 } = params;
			const query_sql = `SELECT rerank_flash($1, $2, $3) AS results`;
			const result = await this.executor.executeQueryOne(query_sql, [query, documents, top_k]);
			return this.success(result, { method: "flash", top_k });
		} catch (error) {
			this.logger.error("Flash reranking failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Flash reranking failed", "RERANKING_ERROR");
		}
	}
}





