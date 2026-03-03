import { Database } from "../db.js";

export class DataManagementTools {
	constructor(private db: Database) {}

	/**
	 * Vacuum vectors (clean up unused space)
	 */
	async vacuumVectors(table: string, dryRun: boolean = false) {
		const result = await this.db.query("SELECT vacuum_vectors($1, $2) AS affected", [
			table,
			dryRun,
		]);
		return { affected: result.rows[0].affected, dryRun };
	}

	/**
	 * Compress cold tier vectors (older than threshold)
	 */
	async compressColdTier(table: string, daysThreshold: number = 30) {
		const result = await this.db.query(
			"SELECT compress_cold_tier($1, $2) AS compressed",
			[table, daysThreshold]
		);
		return { compressed: result.rows[0].compressed, threshold: daysThreshold };
	}

	/**
	 * Sync index to replica (async)
	 */
	async syncIndexAsync(indexName: string, replicaHost: string) {
		const result = await this.db.query(
			"SELECT sync_index_async($1, $2) AS sync_id",
			[indexName, replicaHost]
		);
		return { syncId: result.rows[0].sync_id };
	}
}

