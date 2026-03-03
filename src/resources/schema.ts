/**
 * Schema resource
 */

import { BaseResource } from "./base.js";
import { Database } from "../database/connection.js";

export class SchemaResource extends BaseResource {
	constructor(db: Database) {
		super(db);
	}

	getUri(): string {
		return "neurondb://schema";
	}

	getName(): string {
		return "Database Schema";
	}

	getDescription(): string {
		return "NeurondB database schema information";
	}

	getMimeType(): string {
		return "application/json";
	}

	async getContent(): Promise<any> {
		const query = `
			SELECT 
				table_schema,
				table_name,
				column_name,
				data_type,
				udt_name
			FROM information_schema.columns
			WHERE table_schema = 'neurondb' OR table_schema = 'public'
			ORDER BY table_schema, table_name, ordinal_position
		`;
		const result = await this.db.query(query);
		return result.rows;
	}
}





