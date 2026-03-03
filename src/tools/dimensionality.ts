import { Database } from "../db.js";

export class DimensionalityTools {
	constructor(private db: Database) {}

	/**
	 * Reduce dimensionality using PCA
	 */
	async reducePCA(
		table: string,
		vectorColumn: string,
		targetDimensions: number
	) {
		const result = await this.db.query(
			"SELECT * FROM neurondb.reduce_pca($1, $2, $3)",
			[table, vectorColumn, targetDimensions]
		);
		return result.rows;
	}

	/**
	 * Apply PCA whitening to embeddings
	 */
	async whitenEmbeddings(table: string, vectorColumn: string) {
		const result = await this.db.query(
			"SELECT * FROM neurondb.whiten_embeddings($1, $2)",
			[table, vectorColumn]
		);
		return result.rows;
	}
}

