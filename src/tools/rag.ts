import { Database } from "../db.js";

export class RAGTools {
	constructor(private db: Database) {}

	async chunkText(params: {
		text: string;
		chunk_size?: number;
		overlap?: number;
	}) {
		const { text, chunk_size = 500, overlap = 50 } = params;

		const query = `
			SELECT neurondb_chunk_text($1::text, $2::integer, $3::integer) AS chunks
		`;

		const result = await this.db.query(query, [text, chunk_size, overlap]);
		return result.rows[0];
	}

	async rerankCrossEncoder(params: {
		query: string;
		documents: string[];
		model?: string;
		top_k?: number;
	}) {
		const {
			query,
			documents,
			model = "ms-marco-MiniLM-L-6-v2",
			top_k = 10,
		} = params;

		const query_sql = `
			SELECT rerank_cross_encoder($1, $2, $3, $4) AS ranked
		`;

		const result = await this.db.query(query_sql, [
			query,
			documents,
			model,
			top_k,
		]);

		return result.rows[0];
	}

	async rerankLLM(params: {
		query: string;
		documents: string[];
		model?: string;
		top_k?: number;
	}) {
		const {
			query,
			documents,
			model = "gpt-3.5-turbo",
			top_k = 10,
		} = params;

		const query_sql = `
			SELECT rerank_llm($1, $2, $3, $4) AS ranked
		`;

		const result = await this.db.query(query_sql, [
			query,
			documents,
			model,
			top_k,
		]);

		return result.rows[0];
	}
}

