import { Database } from "./database/connection.js";

export class Resources {
	constructor(private db: Database) {}

	async getSchema() {
		const result = await this.db.query(`
			SELECT 
				table_schema,
				table_name,
				column_name,
				data_type,
				udt_name
			FROM information_schema.columns
			WHERE table_schema = 'neurondb' OR table_schema = 'public'
			ORDER BY table_schema, table_name, ordinal_position
		`);

		return result.rows;
	}

	async getModels() {
		const result = await this.db.query(`
			SELECT 
				model_id,
				algorithm,
				training_table,
				created_at,
				updated_at
			FROM neurondb.ml_models
			ORDER BY model_id DESC
		`);

		return result.rows;
	}

	async getIndexes() {
		const result = await this.db.query(`
			SELECT 
				schemaname,
				tablename,
				indexname,
				indexdef
			FROM pg_indexes
			WHERE indexdef LIKE '%hnsw%' OR indexdef LIKE '%ivf%'
			ORDER BY schemaname, tablename, indexname
		`);

		return result.rows;
	}

	async getConfig() {
		const result = await this.db.query(`
			SELECT 
				name,
				setting,
				unit,
				category
			FROM pg_settings
			WHERE name LIKE 'neurondb%'
			ORDER BY name
		`);

		return result.rows;
	}

	async getWorkerStatus() {
		const result = await this.db.query(`
			SELECT * FROM neurondb.llm_job_status
		`);

		return result.rows;
	}

	async getVectorStats() {
		const result = await this.db.query(`
			SELECT * FROM neurondb.vector_stats
		`);

		return result.rows;
	}

	async getIndexHealth() {
		const result = await this.db.query(`
			SELECT * FROM neurondb.index_health
		`);

		return result.rows;
	}

	/**
	 * MCP ReadResource handler implementation for built-in URIs.
	 */
	async handleResource(uri: string) {
		let data: any;
		switch (uri) {
			case "neurondb://schema":
				data = await this.getSchema();
				break;
			case "neurondb://models":
				data = await this.getModels();
				break;
			case "neurondb://indexes":
				data = await this.getIndexes();
				break;
			case "neurondb://config":
				data = await this.getConfig();
				break;
			case "neurondb://workers":
				data = await this.getWorkerStatus();
				break;
			case "neurondb://vector_stats":
				data = await this.getVectorStats();
				break;
			case "neurondb://index_health":
				data = await this.getIndexHealth();
				break;
			default:
				throw new Error(`Unknown resource URI: ${uri}`);
		}

		return {
			contents: [
				{
					uri,
					mimeType: "application/json",
					text: JSON.stringify(data, null, 2),
				},
			],
		};
	}
}

