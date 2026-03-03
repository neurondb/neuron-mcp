/**
 * Embedding generation tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class GenerateEmbeddingTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "generate_embedding",
			description: "Generate text embedding using configured model",
			inputSchema: {
				type: "object",
				properties: {
					text: { type: "string", description: "Text to embed" },
					model: { type: "string", description: "Model name (optional, uses default if not specified)" },
				},
				required: ["text"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { text, model } = params;
			let query = "SELECT embed_text($1) AS embedding";
			const queryParams: any[] = [text];

			if (model) {
				query = "SELECT embed_text($1, $2) AS embedding";
				queryParams.push(model);
			}

			const result = await this.executor.executeQueryOne(query, queryParams);
			return this.success(result, { model: model || "default" });
		} catch (error) {
			this.logger.error("Embedding generation failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Embedding generation failed",
				"EMBEDDING_ERROR"
			);
		}
	}
}

export class BatchEmbeddingTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "batch_embedding",
			description: "Generate embeddings for multiple texts efficiently",
			inputSchema: {
				type: "object",
				properties: {
					texts: {
						type: "array",
						items: { type: "string" },
						description: "Array of texts to embed",
						minItems: 1,
						maxItems: 1000,
					},
					model: { type: "string", description: "Model name (optional)" },
				},
				required: ["texts"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { texts, model } = params;
			let query = "SELECT embed_text_batch($1) AS embeddings";
			const queryParams: any[] = [texts];

			if (model) {
				query = "SELECT embed_text_batch($1, $2) AS embeddings";
				queryParams.push(model);
			}

			const result = await this.executor.executeQueryOne(query, queryParams);
			return this.success(result, {
				count: texts.length,
				model: model || "default",
			});
		} catch (error) {
			this.logger.error("Batch embedding failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Batch embedding failed", "EMBEDDING_ERROR");
		}
	}
}

export class EmbedImageTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "embed_image",
			description: "Generate embedding for an image (BYTEA format)",
			inputSchema: {
				type: "object",
				properties: {
					image_data: {
						type: "string",
						description: "Image data as base64 encoded string or hex",
						format: "byte",
					},
					model: {
						type: "string",
						description: "Model name (default: 'clip')",
						default: "clip",
					},
				},
				required: ["image_data"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { image_data, model = "clip" } = params;
			// Convert base64 or hex to bytea
			const imageBytes = Buffer.from(image_data, image_data.startsWith("\\x") ? "hex" : "base64");
			const query = "SELECT embed_image($1::bytea, $2) AS embedding";
			const result = await this.executor.executeQueryOne(query, [imageBytes, model]);
			return this.success(result, { model });
		} catch (error) {
			this.logger.error("Image embedding failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Image embedding failed", "EMBEDDING_ERROR");
		}
	}
}

export class EmbedMultimodalTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "embed_multimodal",
			description: "Generate multimodal embedding from text and image",
			inputSchema: {
				type: "object",
				properties: {
					text: { type: "string", description: "Text input" },
					image_data: {
						type: "string",
						description: "Image data as base64 or hex",
						format: "byte",
					},
					model: {
						type: "string",
						description: "Model name (default: 'clip')",
						default: "clip",
					},
				},
				required: ["text", "image_data"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { text, image_data, model = "clip" } = params;
			const imageBytes = Buffer.from(image_data, image_data.startsWith("\\x") ? "hex" : "base64");
			const query = "SELECT embed_multimodal($1, $2::bytea, $3) AS embedding";
			const result = await this.executor.executeQueryOne(query, [text, imageBytes, model]);
			return this.success(result, { model });
		} catch (error) {
			this.logger.error("Multimodal embedding failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Multimodal embedding failed",
				"EMBEDDING_ERROR"
			);
		}
	}
}

export class EmbedCachedTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "embed_cached",
			description: "Generate cached embedding (uses cache if available)",
			inputSchema: {
				type: "object",
				properties: {
					text: { type: "string", description: "Text to embed" },
					model: {
						type: "string",
						description: "Model name (default: 'all-MiniLM-L6-v2')",
						default: "all-MiniLM-L6-v2",
					},
				},
				required: ["text"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { text, model = "all-MiniLM-L6-v2" } = params;
			const query = "SELECT embed_cached($1, $2) AS embedding";
			const result = await this.executor.executeQueryOne(query, [text, model]);
			return this.success(result, { model, cached: true });
		} catch (error) {
			this.logger.error("Cached embedding failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Cached embedding failed", "EMBEDDING_ERROR");
		}
	}
}

