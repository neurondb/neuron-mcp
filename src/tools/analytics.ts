import { Database } from "../db.js";
import { ClusteringParams } from "../types.js";

export class AnalyticsTools {
	constructor(private db: Database) {}

	async clusterKMeans(params: ClusteringParams) {
		const { table, vector_column, k, max_iter = 100 } = params;

		const query = `
			SELECT cluster_kmeans($1, $2, $3, $4) AS clusters
		`;

		const result = await this.db.query(query, [
			table,
			vector_column,
			k,
			max_iter,
		]);

		return result.rows[0];
	}

	async clusterMiniBatchKMeans(params: ClusteringParams) {
		const { table, vector_column, k, max_iter = 100 } = params;
		const batch_size = params.params?.batch_size || 100;

		const query = `
			SELECT cluster_minibatch_kmeans($1, $2, $3, $4, $5) AS clusters
		`;

		const result = await this.db.query(query, [
			table,
			vector_column,
			k,
			max_iter,
			batch_size,
		]);

		return result.rows[0];
	}

	async clusterGMM(params: ClusteringParams) {
		const { table, vector_column, k, max_iter = 100 } = params;

		const query = `
			SELECT cluster_gmm($1, $2, $3, $4) AS probabilities
		`;

		const result = await this.db.query(query, [
			table,
			vector_column,
			k,
			max_iter,
		]);

		return result.rows[0];
	}

	async detectOutliersZScore(params: {
		table: string;
		vector_column: string;
		threshold?: number;
	}) {
		const { table, vector_column, threshold = 3.0 } = params;

		const query = `
			SELECT detect_outliers_zscore($1, $2, $3) AS outliers
		`;

		const result = await this.db.query(query, [
			table,
			vector_column,
			threshold,
		]);

		return result.rows[0];
	}

	async computePCA(params: {
		table: string;
		vector_column: string;
		n_components: number;
	}) {
		const { table, vector_column, n_components } = params;

		const query = `
			SELECT compute_pca($1, $2, $3) AS components
		`;

		const result = await this.db.query(query, [
			table,
			vector_column,
			n_components,
		]);

		return result.rows[0];
	}
}

