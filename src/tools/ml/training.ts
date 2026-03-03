/**
 * ML model training tools
 */

import { BaseTool } from "../base/tool.js";
import type { ToolDefinition, ToolResult } from "../registry.js";
import { QueryExecutor } from "../base/executor.js";
import type { Database } from "../../database/connection.js";
import type { Logger } from "../../logging/logger.js";

export class TrainLinearRegressionTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_linear_regression",
			description: "Train a linear regression model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string", description: "Training data table" },
					feature_col: { type: "string", description: "Feature column name (vector)" },
					label_col: { type: "string", description: "Label column name" },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col } = params;
			const query = `SELECT train_linear_regression($1, $2, $3) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [table, feature_col, label_col]);
			return this.success(result, { algorithm: "linear_regression" });
		} catch (error) {
			this.logger.error("Linear regression training failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Linear regression training failed",
				"TRAINING_ERROR"
			);
		}
	}
}

export class TrainRidgeRegressionTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_ridge_regression",
			description: "Train a ridge regression model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					alpha: { type: "number", default: 1.0, description: "Regularization strength" },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, alpha = 1.0 } = params;
			const query = `SELECT train_ridge_regression($1, $2, $3, $4) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [table, feature_col, label_col, alpha]);
			return this.success(result, { algorithm: "ridge", alpha });
		} catch (error) {
			this.logger.error("Ridge regression training failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Ridge regression training failed",
				"TRAINING_ERROR"
			);
		}
	}
}

export class TrainLassoRegressionTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_lasso_regression",
			description: "Train a lasso regression model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					alpha: { type: "number", default: 1.0 },
					max_iter: { type: "number", default: 1000 },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, alpha = 1.0, max_iter = 1000 } = params;
			const query = `SELECT train_lasso_regression($1, $2, $3, $4, $5) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [table, feature_col, label_col, alpha, max_iter]);
			return this.success(result, { algorithm: "lasso", alpha, max_iter });
		} catch (error) {
			this.logger.error("Lasso regression training failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Lasso regression training failed",
				"TRAINING_ERROR"
			);
		}
	}
}

export class TrainLogisticRegressionTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_logistic_regression",
			description: "Train a logistic regression model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					max_iter: { type: "number", default: 1000 },
					learning_rate: { type: "number", default: 0.01 },
					tolerance: { type: "number", default: 0.001 },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, max_iter = 1000, learning_rate = 0.01, tolerance = 0.001 } = params;
			const query = `SELECT train_logistic_regression($1, $2, $3, $4, $5, $6) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [
				table,
				feature_col,
				label_col,
				max_iter,
				learning_rate,
				tolerance,
			]);
			return this.success(result, { algorithm: "logistic", max_iter, learning_rate, tolerance });
		} catch (error) {
			this.logger.error("Logistic regression training failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Logistic regression training failed",
				"TRAINING_ERROR"
			);
		}
	}
}

export class TrainRandomForestTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_random_forest",
			description: "Train a random forest model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					n_estimators: { type: "number", default: 100 },
					max_depth: { type: "number", default: 10 },
					min_samples_split: { type: "number", default: 2 },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, n_estimators = 100, max_depth = 10, min_samples_split = 2 } = params;
			const query = `SELECT train_random_forest_classifier($1, $2, $3, $4, $5, $6) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [
				table,
				feature_col,
				label_col,
				n_estimators,
				max_depth,
				min_samples_split,
			]);
			return this.success(result, { algorithm: "random_forest", n_estimators, max_depth, min_samples_split });
		} catch (error) {
			this.logger.error("Random forest training failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Random forest training failed",
				"TRAINING_ERROR"
			);
		}
	}
}

export class TrainSVMTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_svm",
			description: "Train a support vector machine model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					kernel: {
						type: "string",
						enum: ["linear", "rbf", "poly", "sigmoid"],
						default: "rbf",
					},
					C: { type: "number", default: 1.0 },
					gamma: { type: "string", default: "scale" },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, kernel = "rbf", C = 1.0, gamma = "scale" } = params;
			const query = `SELECT train_svm_classifier($1, $2, $3, $4, $5, $6) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [table, feature_col, label_col, kernel, C, gamma]);
			return this.success(result, { algorithm: "svm", kernel, C, gamma });
		} catch (error) {
			this.logger.error("SVM training failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "SVM training failed", "TRAINING_ERROR");
		}
	}
}

export class TrainKNNTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_knn",
			description: "Train a K-nearest neighbors model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					k: { type: "number", default: 5, minimum: 1 },
					distance_metric: {
						type: "string",
						enum: ["l2", "cosine", "l1"],
						default: "l2",
					},
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, k = 5, distance_metric = "l2" } = params;
			const query = `SELECT train_knn_classifier($1, $2, $3, $4, $5) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [table, feature_col, label_col, k, distance_metric]);
			return this.success(result, { algorithm: "knn", k, distance_metric });
		} catch (error) {
			this.logger.error("KNN training failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "KNN training failed", "TRAINING_ERROR");
		}
	}
}

export class TrainDecisionTreeTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_decision_tree",
			description: "Train a decision tree model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					max_depth: { type: "number", default: 10 },
					min_samples_split: { type: "number", default: 2 },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, max_depth = 10, min_samples_split = 2 } = params;
			const query = `SELECT train_decision_tree_classifier($1, $2, $3, $4, $5) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [
				table,
				feature_col,
				label_col,
				max_depth,
				min_samples_split,
			]);
			return this.success(result, { algorithm: "decision_tree", max_depth, min_samples_split });
		} catch (error) {
			this.logger.error("Decision tree training failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Decision tree training failed",
				"TRAINING_ERROR"
			);
		}
	}
}

export class TrainNaiveBayesTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_naive_bayes",
			description: "Train a naive Bayes model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col } = params;
			const query = `SELECT train_naive_bayes_classifier($1, $2, $3) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [table, feature_col, label_col]);
			return this.success(result, { algorithm: "naive_bayes" });
		} catch (error) {
			this.logger.error("Naive Bayes training failed", error as Error, { params });
			return this.error(
				error instanceof Error ? error.message : "Naive Bayes training failed",
				"TRAINING_ERROR"
			);
		}
	}
}

export class TrainXGBoostTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_xgboost",
			description: "Train an XGBoost model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					n_estimators: { type: "number", default: 100 },
					max_depth: { type: "number", default: 6 },
					learning_rate: { type: "number", default: 0.1 },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, n_estimators = 100, max_depth = 6, learning_rate = 0.1 } = params;
			const query = `SELECT train_xgboost_classifier($1, $2, $3, $4, $5, $6) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [
				table,
				feature_col,
				label_col,
				n_estimators,
				max_depth,
				learning_rate,
			]);
			return this.success(result, { algorithm: "xgboost", n_estimators, max_depth, learning_rate });
		} catch (error) {
			this.logger.error("XGBoost training failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "XGBoost training failed", "TRAINING_ERROR");
		}
	}
}

export class TrainLightGBMTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_lightgbm",
			description: "Train a LightGBM model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					n_estimators: { type: "number", default: 100 },
					max_depth: { type: "number", default: -1 },
					learning_rate: { type: "number", default: 0.1 },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, n_estimators = 100, max_depth = -1, learning_rate = 0.1 } = params;
			const query = `SELECT train_lightgbm_classifier($1, $2, $3, $4, $5, $6) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [
				table,
				feature_col,
				label_col,
				n_estimators,
				max_depth,
				learning_rate,
			]);
			return this.success(result, { algorithm: "lightgbm", n_estimators, max_depth, learning_rate });
		} catch (error) {
			this.logger.error("LightGBM training failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "LightGBM training failed", "TRAINING_ERROR");
		}
	}
}

export class TrainCatBoostTool extends BaseTool {
	private executor: QueryExecutor;

	constructor(db: Database, logger: Logger) {
		super(db, logger);
		this.executor = new QueryExecutor(db);
	}

	getDefinition(): ToolDefinition {
		return {
			name: "train_catboost",
			description: "Train a CatBoost model",
			inputSchema: {
				type: "object",
				properties: {
					table: { type: "string" },
					feature_col: { type: "string" },
					label_col: { type: "string" },
					iterations: { type: "number", default: 100 },
					depth: { type: "number", default: 6 },
					learning_rate: { type: "number", default: 0.1 },
				},
				required: ["table", "feature_col", "label_col"],
			},
		};
	}

	async execute(params: Record<string, any>): Promise<ToolResult> {
		const validation = this.validateParams(params, this.getDefinition().inputSchema);
		if (!validation.valid) {
			return this.error("Invalid parameters", "VALIDATION_ERROR", { errors: validation.errors });
		}

		try {
			const { table, feature_col, label_col, iterations = 100, depth = 6, learning_rate = 0.1 } = params;
			const query = `SELECT train_catboost_classifier($1, $2, $3, $4, $5, $6) AS model_id`;
			const result = await this.executor.executeQueryOne(query, [
				table,
				feature_col,
				label_col,
				iterations,
				depth,
				learning_rate,
			]);
			return this.success(result, { algorithm: "catboost", iterations, depth, learning_rate });
		} catch (error) {
			this.logger.error("CatBoost training failed", error as Error, { params });
			return this.error(error instanceof Error ? error.message : "CatBoost training failed", "TRAINING_ERROR");
		}
	}
}





