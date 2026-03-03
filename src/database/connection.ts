/**
 * Enhanced Database class with query builder support
 */

import { Pool, QueryResult, PoolConfig } from "pg";
import { DatabaseConfig } from "../config/schema.js";
import { QueryBuilder } from "./query.js";

export class Database {
	private pool: Pool | null = null;
	public queryBuilder: typeof QueryBuilder = QueryBuilder;

	/**
	 * Connect to database
	 */
	connect(config: DatabaseConfig): void {
		const poolConfig: PoolConfig = {};

		if (config.connectionString) {
			poolConfig.connectionString = config.connectionString;
		} else {
			poolConfig.host = config.host || "localhost";
			poolConfig.port = config.port || 5432;
			poolConfig.database = config.database || "postgres";
			poolConfig.user = config.user || "postgres";
			poolConfig.password = config.password;
		}

		// Apply pool settings
		if (config.pool) {
			poolConfig.min = config.pool.min;
			poolConfig.max = config.pool.max;
			poolConfig.idleTimeoutMillis = config.pool.idleTimeoutMillis;
			poolConfig.connectionTimeoutMillis = config.pool.connectionTimeoutMillis;
		}

		// Apply SSL settings
		if (config.ssl) {
			poolConfig.ssl = config.ssl;
		}

		this.pool = new Pool(poolConfig);

		// Handle pool errors
		this.pool.on("error", (err) => {
			const errorMessage = err instanceof Error ? err.message : String(err);
			console.error(`Database connection pool error occurred: ${errorMessage}`, err);
		});
	}

	/**
	 * Execute query
	 */
	async query(text: string, params?: any[]): Promise<QueryResult> {
		if (!this.pool) {
			throw new Error("Database not connected");
		}
		return this.pool.query(text, params);
	}

	/**
	 * Execute query with prepared statement
	 */
	async preparedQuery(name: string, text: string, params?: any[]): Promise<QueryResult> {
		if (!this.pool) {
			throw new Error("Database not connected");
		}
		return this.pool.query({
			name,
			text,
			values: params,
		});
	}

	/**
	 * Execute transaction
	 */
	async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
		if (!this.pool) {
			throw new Error("Database not connected");
		}

		const client = await this.pool.connect();
		try {
			await client.query("BEGIN");
			const result = await callback(client);
			await client.query("COMMIT");
			return result;
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	}

	/**
	 * Escape SQL identifier
	 */
	escapeIdentifier(identifier: string): string {
		return QueryBuilder.escapeIdentifier(identifier);
	}

	/**
	 * Test database connection
	 */
	async testConnection(): Promise<void> {
		await this.query("SELECT 1");
	}

	/**
	 * Close database connection
	 */
	async close(): Promise<void> {
		if (this.pool) {
			await this.pool.end();
			this.pool = null;
		}
	}

	/**
	 * Get pool statistics
	 */
	getPoolStats() {
		if (!this.pool) {
			return null;
		}
		return {
			totalCount: this.pool.totalCount,
			idleCount: this.pool.idleCount,
			waitingCount: this.pool.waitingCount,
		};
	}
}





