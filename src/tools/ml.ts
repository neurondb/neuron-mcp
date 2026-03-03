import { Database } from "../db.js";
import { MLTrainingParams, MLPredictionParams } from "../types.js";

export class MLTools {
	constructor(private db: Database) {}

	async trainLinearRegression(params: MLTrainingParams) {
		const { table, feature_col, label_col } = params;

		const query = `
			SELECT train_linear_regression($1, $2, $3) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
		]);

		return result.rows[0];
	}

	async trainRidgeRegression(params: MLTrainingParams) {
		const { table, feature_col, label_col, params: hyperparams } = params;
		const alpha = hyperparams?.alpha || 1.0;

		const query = `
			SELECT train_ridge_regression($1, $2, $3, $4) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
			alpha,
		]);

		return result.rows[0];
	}

	async trainLassoRegression(params: MLTrainingParams) {
		const { table, feature_col, label_col, params: hyperparams } = params;
		const alpha = hyperparams?.alpha || 1.0;
		const max_iter = hyperparams?.max_iter || 1000;

		const query = `
			SELECT train_lasso_regression($1, $2, $3, $4, $5) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
			alpha,
			max_iter,
		]);

		return result.rows[0];
	}

	async trainLogisticRegression(params: MLTrainingParams) {
		const { table, feature_col, label_col, params: hyperparams } = params;
		const max_iter = hyperparams?.max_iter || 1000;
		const learning_rate = hyperparams?.learning_rate || 0.01;
		const tolerance = hyperparams?.tolerance || 0.001;

		const query = `
			SELECT train_logistic_regression($1, $2, $3, $4, $5, $6) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
			max_iter,
			learning_rate,
			tolerance,
		]);

		return result.rows[0];
	}

	async trainRandomForest(params: MLTrainingParams) {
		const { table, feature_col, label_col, params: hyperparams } = params;
		const n_estimators = hyperparams?.n_estimators || 100;
		const max_depth = hyperparams?.max_depth || 10;
		const min_samples_split = hyperparams?.min_samples_split || 2;

		const query = `
			SELECT train_random_forest_classifier(
				$1, $2, $3, $4, $5, $6
			) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
			n_estimators,
			max_depth,
			min_samples_split,
		]);

		return result.rows[0];
	}

	async trainSVM(params: MLTrainingParams) {
		const { table, feature_col, label_col, params: hyperparams } = params;
		const c = hyperparams?.C || 1.0;
		const max_iters = hyperparams?.max_iters || 1000;

		const query = `
			SELECT train_svm_classifier($1, $2, $3, $4, $5) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
			c,
			max_iters,
		]);

		return result.rows[0];
	}

	async trainKNN(params: MLTrainingParams) {
		const { table, feature_col, label_col, params: hyperparams } = params;
		const k = hyperparams?.k || 5;

		const query = `
			SELECT train_knn_model_id($1, $2, $3, $4) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
			k,
		]);

		return result.rows[0];
	}

	async trainDecisionTree(params: MLTrainingParams) {
		const { table, feature_col, label_col, params: hyperparams } = params;
		const max_depth = hyperparams?.max_depth || 10;
		const min_samples_split = hyperparams?.min_samples_split || 2;

		const query = `
			SELECT train_decision_tree_classifier(
				$1, $2, $3, $4, $5
			) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
			max_depth,
			min_samples_split,
		]);

		return result.rows[0];
	}

	async trainNaiveBayes(params: MLTrainingParams) {
		const { table, feature_col, label_col } = params;

		const query = `
			SELECT train_naive_bayes_classifier_model_id($1, $2, $3) AS model_id
		`;

		const result = await this.db.query(query, [
			table,
			feature_col,
			label_col,
		]);

		return result.rows[0];
	}

	async predict(params: MLPredictionParams) {
		const { model_id, features } = params;
		const featuresStr = `[${features.join(",")}]`;

		const query = `
			SELECT neurondb_predict($1, $2::real[]) AS prediction
		`;

		const result = await this.db.query(query, [model_id, featuresStr]);
		return result.rows[0];
	}

	async getModelInfo(model_id?: number) {
		let query = `
			SELECT 
				model_id,
				algorithm,
				training_table,
				created_at,
				updated_at
			FROM neurondb.ml_models
		`;
		const params: any[] = [];

		if (model_id) {
			query += " WHERE model_id = $1";
			params.push(model_id);
		}

		query += " ORDER BY model_id DESC";

		const result = await this.db.query(query, params);
		return result.rows;
	}
}

