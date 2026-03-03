/**
 * Vector arithmetic and operations tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class VectorAddTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_add",
			description: "Add two vectors element-wise",
			inputSchema: {
				type: "object",
				properties: {
					vector1: { type: "array", items: { type: "number" }, description: "First vector" },
					vector2: { type: "array", items: { type: "number" }, description: "Second vector" },
				},
				required: ["vector1", "vector2"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { vector1, vector2 } = params;
			const v1Str = `[${vector1.join(",")}]`;
			const v2Str = `[${vector2.join(",")}]`;
			const query = `SELECT ($1::vector + $2::vector) AS result`;
			const result = await this.executor.executeQueryOne(query, [v1Str, v2Str]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector addition failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Vector addition failed", "OPERATION_ERROR");
		}
	}
}

export class VectorNormTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_norm",
			description: "Calculate L2 norm of a vector",
			inputSchema: {
				type: "object",
				properties: {
					vector: { type: "array", items: { type: "number" }, description: "Input vector" },
				},
				required: ["vector"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { vector } = params;
			const vStr = `[${vector.join(",")}]`;
			const query = `SELECT vector_norm($1::vector) AS norm`;
			const result = await this.executor.executeQueryOne(query, [vStr]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector norm calculation failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Vector norm calculation failed",
				"OPERATION_ERROR"
			);
		}
	}
}

export class VectorNormalizeTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_normalize",
			description: "Normalize a vector to unit length",
			inputSchema: {
				type: "object",
				properties: {
					vector: { type: "array", items: { type: "number" }, description: "Input vector" },
				},
				required: ["vector"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { vector } = params;
			const vStr = `[${vector.join(",")}]`;
			const query = `SELECT vector_normalize($1::vector) AS normalized`;
			const result = await this.executor.executeQueryOne(query, [vStr]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector normalization failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Vector normalization failed",
				"OPERATION_ERROR"
			);
		}
	}
}

export class VectorDotProductTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_dot_product",
			description: "Calculate dot product of two vectors",
			inputSchema: {
				type: "object",
				properties: {
					vector1: { type: "array", items: { type: "number" }, description: "First vector" },
					vector2: { type: "array", items: { type: "number" }, description: "Second vector" },
				},
				required: ["vector1", "vector2"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { vector1, vector2 } = params;
			const v1Str = `[${vector1.join(",")}]`;
			const v2Str = `[${vector2.join(",")}]`;
			const query = `SELECT vector_dot($1::vector, $2::vector) AS dot_product`;
			const result = await this.executor.executeQueryOne(query, [v1Str, v2Str]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Dot product calculation failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Dot product calculation failed",
				"OPERATION_ERROR"
			);
		}
	}
}





