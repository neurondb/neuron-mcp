/**
 * Enhanced Resources class
 */

import { Database } from "../database/connection.js";
import { SchemaResource } from "./schema.js";
import { ModelsResource } from "./models.js";

export class Resources {
	private resources: Map<string, any> = new Map();

	constructor(private db: Database) {
		// Register built-in resources
		this.register(new SchemaResource(db));
		this.register(new ModelsResource(db));
	}

	private register(resource: any) {
		this.resources.set(resource.getUri(), resource);
	}

	async handleResource(uri: string): Promise<any> {
		const resource = this.resources.get(uri);
		if (!resource) {
			throw new Error(`Resource not found: ${uri}`);
		}

		const content = await resource.getContent();
		return {
			contents: [
				{
					uri,
					mimeType: resource.getMimeType(),
					text: JSON.stringify(content, null, 2),
				},
			],
		};
	}

	// Legacy methods for backward compatibility
	async getSchema() {
		const resource = this.resources.get("neurondb://schema");
		return resource ? await resource.getContent() : [];
	}

	async getModels() {
		const resource = this.resources.get("neurondb://models");
		return resource ? await resource.getContent() : [];
	}

	async getIndexes() {
		const query = `
			SELECT 
				schemaname,
				tablename,
				indexname,
				indexdef
			FROM pg_indexes
			WHERE indexdef LIKE '%hnsw%' OR indexdef LIKE '%ivf%'
			ORDER BY schemaname, tablename, indexname
		`;
		const result = await this.db.query(query);
		return result.rows;
	}

	async getConfig() {
		const query = `
			SELECT 
				name,
				setting,
				unit,
				category
			FROM pg_settings
			WHERE name LIKE 'neurondb%'
			ORDER BY name
		`;
		const result = await this.db.query(query);
		return result.rows;
	}

	async getWorkerStatus() {
		const query = `SELECT * FROM neurondb.neurondb_workers`;
		const result = await this.db.query(query);
		return result.rows;
	}

	async getVectorStats() {
		const query = `SELECT * FROM neurondb.vector_stats`;
		const result = await this.db.query(query);
		return result.rows;
	}

	async getIndexHealth() {
		const query = `SELECT * FROM neurondb.index_health`;
		const result = await this.db.query(query);
		return result.rows;
	}
}





