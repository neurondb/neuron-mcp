/**
 * Query execution helpers for tools
 */

import { Database } from "../../database/connection.js";
import { QueryResult } from "pg";

export class QueryExecutor {
	constructor(private db: Database) {}

	/**
	 * Execute a query and return rows
	 */
	async executeQuery(query: string, params?: any[]): Promise<any[]> {
		const result = await this.db.query(query, params);
		return result.rows;
	}

	/**
	 * Execute a query and return single row
	 */
	async executeQueryOne(query: string, params?: any[]): Promise<any | null> {
		const result = await this.db.query(query, params);
		return result.rows[0] || null;
	}

	/**
	 * Execute a query and return full result
	 */
	async executeQueryFull(query: string, params?: any[]): Promise<QueryResult> {
		return this.db.query(query, params);
	}

	/**
	 * Execute a function call
	 */
	async executeFunction(functionName: string, params: any[]): Promise<any> {
		const paramPlaceholders = params.map((_, i) => `$${i + 1}`).join(", ");
		const query = `SELECT ${this.db.escapeIdentifier(functionName)}(${paramPlaceholders}) AS result`;
		const result = await this.executeQueryOne(query, params);
		return result?.result;
	}

	/**
	 * Execute a function call that returns a table
	 */
	async executeFunctionTable(functionName: string, params: any[]): Promise<any[]> {
		const paramPlaceholders = params.map((_, i) => `$${i + 1}`).join(", ");
		const query = `SELECT * FROM ${this.db.escapeIdentifier(functionName)}(${paramPlaceholders})`;
		return this.executeQuery(query, params);
	}

	/**
	 * Execute vector search query
	 */
	async executeVectorSearch(
		table: string,
		vectorColumn: string,
		queryVector: number[],
		distanceMetric: "l2" | "cosine" | "inner_product" | "l1" | "hamming" | "chebyshev" | "minkowski" = "l2",
		limit: number = 10,
		additionalColumns: string[] = []
	): Promise<any[]> {
		const { query, params } = this.db.queryBuilder.vectorSearch(
			table,
			vectorColumn,
			queryVector,
			distanceMetric,
			limit,
			additionalColumns
		);
		return this.executeQuery(query, params);
	}

	/**
	 * Execute batch operation
	 */
	async executeBatch(queries: Array<{ query: string; params?: any[] }>): Promise<any[][]> {
		const results: any[][] = [];
		for (const { query, params } of queries) {
			const result = await this.executeQuery(query, params);
			results.push(result);
		}
		return results;
	}

	/**
	 * Execute in transaction
	 */
	async executeTransaction<T>(callback: (executor: QueryExecutor) => Promise<T>): Promise<T> {
		return this.db.transaction(async (client) => {
			// Create a temporary executor with the transaction client
			const tempDb = { ...this.db, pool: { query: (text: string, params?: any[]) => client.query(text, params) } } as any;
			const tempExecutor = new QueryExecutor(tempDb);
			return callback(tempExecutor);
		});
	}
}





