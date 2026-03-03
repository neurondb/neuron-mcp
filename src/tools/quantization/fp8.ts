/**
 * FP8 quantization tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class QuantizeFP8Tool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "quantize_fp8",
			description: "Quantize vector to FP8 format",
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
			const query = `SELECT quantize_fp8($1::vector) AS quantized`;
			const result = await this.executor.executeQueryOne(query, [vStr]);
			return this.success(result, { method: "fp8" });
		} catch (error) {
			this.logger.error("FP8 quantization failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "FP8 quantization failed", "QUANTIZATION_ERROR");
		}
	}
}

export class AnalyzeFP8Tool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "analyze_fp8",
			description: "Analyze FP8 quantization impact",
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
			const query = `SELECT quantize_analyze_fp8($1::vector) AS analysis`;
			const result = await this.executor.executeQueryOne(query, [vStr]);
			return this.success(result, { method: "fp8" });
		} catch (error) {
			this.logger.error("FP8 analysis failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "FP8 analysis failed", "QUANTIZATION_ERROR");
		}
	}
}





