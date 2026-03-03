import { Database } from "../db.js";

export class IndexingTools {
	constructor(private db: Database) {}

	/**
	 * Create HNSW index
	 */
	async createHNSWIndex(
		table: string,
		vectorColumn: string,
		indexName: string,
		m: number = 16,
		efConstruction: number = 200
	) {
		const result = await this.db.query(
			"SELECT hnsw_create_index($1, $2, $3, $4, $5) AS success",
			[table, vectorColumn, indexName, m, efConstruction]
		);
		return { success: result.rows[0].success, indexName };
	}

	/**
	 * Create IVF index
	 */
	async createIVFIndex(
		table: string,
		vectorColumn: string,
		indexName: string,
		numLists: number = 100
	) {
		const result = await this.db.query(
			"SELECT ivf_create_index($1, $2, $3, $4) AS success",
			[table, vectorColumn, indexName, numLists]
		);
		return { success: result.rows[0].success, indexName };
	}

	/**
	 * Rebalance index
	 */
	async rebalanceIndex(indexName: string, threshold: number = 0.8) {
		const result = await this.db.query(
			"SELECT rebalance_index($1, $2) AS rebalanced",
			[indexName, threshold]
		);
		return { rebalanced: result.rows[0].rebalanced };
	}

	/**
	 * Get index statistics
	 */
	async getIndexStats(indexName: string) {
		const result = await this.db.query(
			`
			SELECT 
				indexname,
				indexdef,
				pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
			FROM pg_indexes
			WHERE indexname = $1
		`,
			[indexName]
		);
		return result.rows[0];
	}

	/**
	 * Drop index
	 */
	async dropIndex(indexName: string) {
		const escaped = this.db.escapeIdentifier(indexName);
		await this.db.query(`DROP INDEX IF EXISTS ${escaped}`);
		return { success: true, message: `Index ${indexName} dropped` };
	}
}

