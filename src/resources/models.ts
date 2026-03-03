/**
 * Models resource
 */

import { BaseResource } from "./base.js";
import { Database } from "../database/connection.js";

export class ModelsResource extends BaseResource {
	constructor(db: Database) {
		super(db);
	}

	getUri(): string {
		return "neurondb://models";
	}

	getName(): string {
		return "ML Models";
	}

	getDescription(): string {
		return "Catalog of trained ML models";
	}

	getMimeType(): string {
		return "application/json";
	}

	async getContent(): Promise<any> {
		const query = `
			SELECT 
				model_id,
				algorithm,
				training_table,
				created_at,
				updated_at
			FROM neurondb.ml_models
			ORDER BY model_id DESC
		`;
		const result = await this.db.query(query);
		return result.rows;
	}
}





