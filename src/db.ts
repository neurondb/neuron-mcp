import { Pool, QueryResult, PoolConfig } from "pg";
import { DatabaseConfig } from "./config.js";

export class Database {
	private pool: Pool | null = null;

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

	async query(text: string, params?: any[]): Promise<QueryResult> {
		if (!this.pool) {
			throw new Error("Database not connected");
		}
		return this.pool.query(text, params);
	}

	escapeIdentifier(identifier: string): string {
		return `"${identifier.replace(/"/g, '""')}"`;
	}

	async testConnection(): Promise<void> {
		await this.query("SELECT 1");
	}

	async close(): Promise<void> {
		if (this.pool) {
			await this.pool.end();
			this.pool = null;
		}
	}
}

