/**
 * Embedding model configuration tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class ConfigureEmbeddingModelTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "configure_embedding_model",
			description: "Configure embedding model settings",
			inputSchema: {
				type: "object",
				properties: {
					model_name: { type: "string", description: "Model name" },
					config_json: {
						type: "string",
						description: "JSON configuration string (e.g., '{\"batch_size\": 32, \"normalize\": true}')",
					},
				},
				required: ["model_name", "config_json"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_name, config_json } = params;
			const query = `SELECT configure_embedding_model($1::text, $2::text) AS success`;
			const result = await this.executor.executeQueryOne(query, [model_name, config_json]);
			return this.success(result, { model_name });
		} catch (error) {
			this.logger.error("Embedding model configuration failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Embedding model configuration failed",
				"CONFIG_ERROR"
			);
		}
	}
}

export class GetEmbeddingModelConfigTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "get_embedding_model_config",
			description: "Get embedding model configuration",
			inputSchema: {
				type: "object",
				properties: {
					model_name: { type: "string", description: "Model name" },
				},
				required: ["model_name"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_name } = params;
			const query = `SELECT get_embedding_model_config($1::text) AS config`;
			const result = await this.executor.executeQueryOne(query, [model_name]);
			if (!result || !result.config) {
				return this.error("Model configuration not found", "NOT_FOUND", { model_name });
			}
			return this.success(result, { model_name });
		} catch (error) {
			this.logger.error("Get embedding model config failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Get embedding model config failed",
				"CONFIG_ERROR"
			);
		}
	}
}

export class ListEmbeddingModelConfigsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "list_embedding_model_configs",
			description: "List all embedding model configurations",
			inputSchema: {
				type: "object",
				properties: {},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		try {
			const query = `SELECT * FROM list_embedding_model_configs()`;
			const results = await this.executor.executeQuery(query);
			return this.success(results, { count: results.length });
		} catch (error) {
			this.logger.error("List embedding model configs failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "List embedding model configs failed",
				"CONFIG_ERROR"
			);
		}
	}
}

export class DeleteEmbeddingModelConfigTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "delete_embedding_model_config",
			description: "Delete embedding model configuration",
			inputSchema: {
				type: "object",
				properties: {
					model_name: { type: "string", description: "Model name to delete" },
				},
				required: ["model_name"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { model_name } = params;
			const query = `SELECT delete_embedding_model_config($1::text) AS deleted`;
			const result = await this.executor.executeQueryOne(query, [model_name]);
			return this.success(result, { model_name });
		} catch (error) {
			this.logger.error("Delete embedding model config failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Delete embedding model config failed",
				"CONFIG_ERROR"
			);
		}
	}
}





