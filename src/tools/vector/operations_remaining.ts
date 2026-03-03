/**
 * Remaining vector arithmetic operations
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class VectorSubtractTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_subtract",
			description: "Subtract two vectors element-wise",
			inputSchema: {
				type: "object",
				properties: {
					vector1: { type: "array", items: { type: "number" } },
					vector2: { type: "array", items: { type: "number" } },
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
			const query = `SELECT ($1::vector - $2::vector) AS result`;
			const result = await this.executor.executeQueryOne(query, [v1Str, v2Str]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector subtraction failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Vector subtraction failed",
				"OPERATION_ERROR"
			);
		}
	}
}

export class VectorMultiplyTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_multiply",
			description: "Multiply vector by scalar",
			inputSchema: {
				type: "object",
				properties: {
					vector: { type: "array", items: { type: "number" } },
					scalar: { type: "number", description: "Scalar value to multiply" },
				},
				required: ["vector", "scalar"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { vector, scalar } = params;
			const vStr = `[${vector.join(",")}]`;
			const query = `SELECT ($1::vector * $2::double precision) AS result`;
			const result = await this.executor.executeQueryOne(query, [vStr, scalar]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector multiplication failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Vector multiplication failed",
				"OPERATION_ERROR"
			);
		}
	}
}

export class VectorDivideTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_divide",
			description: "Divide vector by scalar",
			inputSchema: {
				type: "object",
				properties: {
					vector: { type: "array", items: { type: "number" } },
					scalar: { type: "number", description: "Scalar value to divide by" },
				},
				required: ["vector", "scalar"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { vector, scalar } = params;
			if (scalar === 0) {
				return this.error("Division by zero", "VALIDATION_ERROR");
			}
			const vStr = `[${vector.join(",")}]`;
			const query = `SELECT ($1::vector / $2::double precision) AS result`;
			const result = await this.executor.executeQueryOne(query, [vStr, scalar]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector division failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Vector division failed", "OPERATION_ERROR");
		}
	}
}

export class VectorConcatTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_concat",
			description: "Concatenate two vectors",
			inputSchema: {
				type: "object",
				properties: {
					vector1: { type: "array", items: { type: "number" } },
					vector2: { type: "array", items: { type: "number" } },
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
			const query = `SELECT vector_concat($1::vector, $2::vector) AS result`;
			const result = await this.executor.executeQueryOne(query, [v1Str, v2Str]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector concatenation failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Vector concatenation failed",
				"OPERATION_ERROR"
			);
		}
	}
}

export class VectorMinTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_min",
			description: "Element-wise minimum of two vectors",
			inputSchema: {
				type: "object",
				properties: {
					vector1: { type: "array", items: { type: "number" } },
					vector2: { type: "array", items: { type: "number" } },
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
			const query = `SELECT vector_min($1::vector, $2::vector) AS result`;
			const result = await this.executor.executeQueryOne(query, [v1Str, v2Str]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector min failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Vector min failed", "OPERATION_ERROR");
		}
	}
}

export class VectorMaxTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_max",
			description: "Element-wise maximum of two vectors",
			inputSchema: {
				type: "object",
				properties: {
					vector1: { type: "array", items: { type: "number" } },
					vector2: { type: "array", items: { type: "number" } },
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
			const query = `SELECT vector_max($1::vector, $2::vector) AS result`;
			const result = await this.executor.executeQueryOne(query, [v1Str, v2Str]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector max failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Vector max failed", "OPERATION_ERROR");
		}
	}
}

export class VectorAbsTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_abs",
			description: "Absolute value of vector elements",
			inputSchema: {
				type: "object",
				properties: {
					vector: { type: "array", items: { type: "number" } },
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
			const query = `SELECT vector_abs($1::vector) AS result`;
			const result = await this.executor.executeQueryOne(query, [vStr]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector abs failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Vector abs failed", "OPERATION_ERROR");
		}
	}
}

export class VectorNegateTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "vector_negate",
			description: "Negate vector (multiply by -1)",
			inputSchema: {
				type: "object",
				properties: {
					vector: { type: "array", items: { type: "number" } },
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
			const query = `SELECT (-$1::vector) AS result`;
			const result = await this.executor.executeQueryOne(query, [vStr]);
			return this.success(result);
		} catch (error) {
			this.logger.error("Vector negate failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "Vector negate failed", "OPERATION_ERROR");
		}
	}
}





