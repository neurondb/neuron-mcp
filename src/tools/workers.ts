import { Database } from "../db.js";

export class WorkerTools {
	constructor(private db: Database) {}

	/**
	 * Run queue worker once
	 */
	async runQueueWorker() {
		const result = await this.db.query("SELECT neuranq_run_once() AS processed");
		return { processed: result.rows[0].processed };
	}

	/**
	 * Sample tuner worker
	 */
	async sampleTuner() {
		const result = await this.db.query("SELECT neuranmon_sample() AS sampled");
		return { sampled: result.rows[0].sampled };
	}

	/**
	 * Get worker status
	 */
	async getWorkerStatus() {
		const result = await this.db.query(`
			SELECT 
				worker_name,
				status,
				last_run,
				next_run,
				run_count
			FROM neurondb.worker_status
			ORDER BY worker_name
		`);
		return result.rows;
	}
}

