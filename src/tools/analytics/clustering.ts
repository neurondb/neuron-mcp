/**
 * Clustering tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class ClusterKMeansTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "cluster_kmeans",
			description: "Perform K-means clustering",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					k: { type: "number", minimum: 2, description: "Number of clusters" },
					max_iter: { type: "number", default: 100, minimum: 1 },
				},
				required: ["table", "vector_column", "k"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, k, max_iter = 100 } = params;
			const query = `SELECT cluster_kmeans($1, $2, $3, $4) AS clusters`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, k, max_iter]);
			return this.success(result, { algorithm: "kmeans", k, max_iter });
		} catch (error) {
			this.logger.error("K-means clustering failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "K-means clustering failed", "CLUSTERING_ERROR");
		}
	}
}

export class ClusterMiniBatchKMeansTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "cluster_minibatch_kmeans",
			description: "Perform mini-batch K-means clustering",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					k: { type: "number", minimum: 2 },
					max_iter: { type: "number", default: 100 },
					batch_size: { type: "number", default: 100 },
				},
				required: ["table", "vector_column", "k"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, k, max_iter = 100, batch_size = 100 } = params;
			const query = `SELECT cluster_minibatch_kmeans($1, $2, $3, $4, $5) AS clusters`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, k, max_iter, batch_size]);
			return this.success(result, { algorithm: "minibatch_kmeans", k, max_iter, batch_size });
		} catch (error) {
			this.logger.error("Mini-batch K-means clustering failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Mini-batch K-means clustering failed",
				"CLUSTERING_ERROR"
			);
		}
	}
}

export class ClusterGMMTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "cluster_gmm",
			description: "Perform Gaussian Mixture Model clustering",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					k: { type: "number", minimum: 2 },
					max_iter: { type: "number", default: 100 },
				},
				required: ["table", "vector_column", "k"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, k, max_iter = 100 } = params;
			const query = `SELECT cluster_gmm($1, $2, $3, $4) AS probabilities`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, k, max_iter]);
			return this.success(result, { algorithm: "gmm", k, max_iter });
		} catch (error) {
			this.logger.error("GMM clustering failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "GMM clustering failed", "CLUSTERING_ERROR");
		}
	}
}

export class ClusterDBSCANTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "cluster_dbscan",
			description: "Perform DBSCAN clustering",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					eps: { type: "number", default: 0.5, description: "Maximum distance between samples" },
					min_samples: { type: "number", default: 5, description: "Minimum samples in a cluster" },
				},
				required: ["table", "vector_column"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, eps = 0.5, min_samples = 5 } = params;
			const query = `SELECT cluster_dbscan($1, $2, $3, $4) AS clusters`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, eps, min_samples]);
			return this.success(result, { algorithm: "dbscan", eps, min_samples });
		} catch (error) {
			this.logger.error("DBSCAN clustering failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "DBSCAN clustering failed", "CLUSTERING_ERROR");
		}
	}
}

export class ClusterHierarchicalTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "cluster_hierarchical",
			description: "Perform hierarchical clustering",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					vector_column: { type: "string" },
					n_clusters: { type: "number", minimum: 2 },
					linkage: {
						type: "string",
						enum: ["ward", "complete", "average", "single"],
						default: "ward",
					},
				},
				required: ["table", "vector_column", "n_clusters"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, vector_column, n_clusters, linkage = "ward" } = params;
			const query = `SELECT cluster_hierarchical($1, $2, $3, $4) AS clusters`;
			const result = await this.executor.executeQueryOne(query, [table, vector_column, n_clusters, linkage]);
			return this.success(result, { algorithm: "hierarchical", n_clusters, linkage });
		} catch (error) {
			this.logger.error("Hierarchical clustering failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Hierarchical clustering failed",
				"CLUSTERING_ERROR"
			);
		}
	}
}





