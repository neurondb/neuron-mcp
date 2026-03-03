/**
 * GPU information and status tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class GPUInfoTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "gpu_info",
			description: "Get GPU information and capabilities",
			inputSchema: {
				type: "object",
				properties: {},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		try {
			const query = `SELECT * FROM neurondb_gpu_info()`;
			const result = await this.executor.executeQueryOne(query);
			return this.success(result);
		} catch (error) {
			this.logger.error("GPU info failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "GPU info failed", "GPU_ERROR");
		}
	}
}

export class GPUStatusTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "gpu_status",
			description: "Get current GPU status and utilization",
			inputSchema: {
				type: "object",
				properties: {},
				required: [],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		try {
			const query = `SELECT * FROM neurondb_gpu_status()`;
			const result = await this.executor.executeQueryOne(query);
			return this.success(result);
		} catch (error) {
			this.logger.error("GPU status failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "GPU status failed", "GPU_ERROR");
		}
	}
}





