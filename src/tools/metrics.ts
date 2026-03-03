import { Database } from "../db.js";

export class MetricsTools {
	constructor(private db: Database) {}

	/**
	 * Calculate Recall@K metric
	 */
	async recallAtK(
		groundTruthTable: string,
		groundTruthColumn: string,
		predictionsTable: string,
		predictionsColumn: string,
		queryColumn: string,
		queryId: number,
		k: number
	) {
		const result = await this.db.query(
			"SELECT neurondb.recall_at_k($1, $2, $3, $4, $5, $6, $7) AS recall",
			[
				groundTruthTable,
				groundTruthColumn,
				predictionsTable,
				predictionsColumn,
				queryColumn,
				queryId,
				k,
			]
		);
		return { recall: result.rows[0].recall };
	}

	/**
	 * Calculate Precision@K metric
	 */
	async precisionAtK(
		groundTruthTable: string,
		groundTruthColumn: string,
		predictionsTable: string,
		predictionsColumn: string,
		queryColumn: string,
		queryId: number,
		k: number
	) {
		const result = await this.db.query(
			"SELECT neurondb.precision_at_k($1, $2, $3, $4, $5, $6, $7) AS precision",
			[
				groundTruthTable,
				groundTruthColumn,
				predictionsTable,
				predictionsColumn,
				queryColumn,
				queryId,
				k,
			]
		);
		return { precision: result.rows[0].precision };
	}

	/**
	 * Calculate F1@K metric
	 */
	async f1AtK(
		groundTruthTable: string,
		groundTruthColumn: string,
		predictionsTable: string,
		predictionsColumn: string,
		queryColumn: string,
		queryId: number,
		k: number
	) {
		const result = await this.db.query(
			"SELECT neurondb.f1_at_k($1, $2, $3, $4, $5, $6, $7) AS f1",
			[
				groundTruthTable,
				groundTruthColumn,
				predictionsTable,
				predictionsColumn,
				queryColumn,
				queryId,
				k,
			]
		);
		return { f1: result.rows[0].f1 };
	}

	/**
	 * Calculate Mean Reciprocal Rank (MRR)
	 */
	async meanReciprocalRank(
		groundTruthTable: string,
		groundTruthColumn: string,
		predictionsTable: string,
		predictionsColumn: string,
		rankColumn: string,
		queryColumn: string
	) {
		const result = await this.db.query(
			"SELECT neurondb.mean_reciprocal_rank($1, $2, $3, $4, $5, $6) AS mrr",
			[
				groundTruthTable,
				groundTruthColumn,
				predictionsTable,
				predictionsColumn,
				rankColumn,
				queryColumn,
			]
		);
		return { mrr: result.rows[0].mrr };
	}

	/**
	 * Calculate clustering metrics (Davies-Bouldin, Silhouette)
	 */
	async clusteringMetrics(
		table: string,
		vectorColumn: string,
		clusterColumn: string,
		metric: "davies_bouldin" | "silhouette" = "davies_bouldin"
	) {
		let query: string;
		if (metric === "davies_bouldin") {
			query = `
				SELECT neurondb.davies_bouldin_index($1, $2, $3) AS score
			`;
		} else {
			query = `
				SELECT neurondb.silhouette_score($1, $2, $3) AS score
			`;
		}
		const result = await this.db.query(query, [
			table,
			vectorColumn,
			clusterColumn,
		]);
		return { metric, score: result.rows[0].score };
	}
}

