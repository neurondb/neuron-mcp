/**
 * Multi-source configuration loader
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { ServerConfig } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ConfigLoader {
	/**
	 * Get default configuration
	 */
	static getDefaultConfig(): ServerConfig {
		return {
			database: {
				host: "localhost",
				port: 5432,
				database: "postgres",
				user: "postgres",
				pool: {
					min: 2,
					max: 10,
					idleTimeoutMillis: 30000,
					connectionTimeoutMillis: 5000,
				},
				ssl: false,
			},
			server: {
				name: "neurondb-mcp-server",
				version: "1.0.0",
				timeout: 30000,
				maxRequestSize: 10485760,
				enableMetrics: true,
				enableHealthCheck: true,
			},
			logging: {
				level: "info",
				format: "text",
				output: "stderr",
				enableRequestLogging: true,
				enableResponseLogging: false,
				enableErrorStack: false,
			},
			features: {
				vector: {
					enabled: true,
					defaultDistanceMetric: "l2",
					maxVectorDimension: 16384,
					defaultLimit: 10,
				},
				ml: {
					enabled: true,
					algorithms: [
						"linear_regression",
						"ridge",
						"lasso",
						"logistic",
						"random_forest",
						"svm",
						"knn",
						"decision_tree",
						"naive_bayes",
					],
					maxTrainingTime: 3600000,
					gpuEnabled: false,
				},
				analytics: {
					enabled: true,
					maxClusters: 1000,
					maxIterations: 10000,
				},
				rag: {
					enabled: true,
					defaultChunkSize: 500,
					defaultOverlap: 50,
				},
				projects: {
					enabled: true,
					maxProjects: 1000,
				},
			},
		};
	}

	/**
	 * Load configuration from file
	 */
	static loadFromFile(configPath?: string): ServerConfig | null {
		const possiblePaths = [
			configPath,
			process.env.NEURONDB_MCP_CONFIG,
			join(process.cwd(), "mcp-config.json"),
			join(__dirname, "..", "..", "mcp-config.json"),
			join(process.env.HOME || "", ".neurondb", "mcp-config.json"),
		].filter(Boolean) as string[];

		for (const path of possiblePaths) {
			if (existsSync(path)) {
				try {
					const content = readFileSync(path, "utf-8");
					const config = JSON.parse(content);
					return config;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.error(`Failed to load configuration file from path "${path}": ${errorMessage}`, error);
				}
			}
		}

		return null;
	}

	/**
	 * Merge configuration with environment variables
	 */
	static mergeWithEnv(config: ServerConfig): ServerConfig {
		const merged = { ...config };

		// Database config from env
		if (process.env.NEURONDB_CONNECTION_STRING) {
			merged.database.connectionString = process.env.NEURONDB_CONNECTION_STRING;
		}
		if (process.env.NEURONDB_HOST) {
			merged.database.host = process.env.NEURONDB_HOST;
		}
		if (process.env.NEURONDB_PORT) {
			merged.database.port = parseInt(process.env.NEURONDB_PORT);
		}
		if (process.env.NEURONDB_DATABASE) {
			merged.database.database = process.env.NEURONDB_DATABASE;
		}
		if (process.env.NEURONDB_USER) {
			merged.database.user = process.env.NEURONDB_USER;
		}
		if (process.env.NEURONDB_PASSWORD) {
			merged.database.password = process.env.NEURONDB_PASSWORD;
		}

		// Logging config from env
		if (process.env.NEURONDB_LOG_LEVEL) {
			merged.logging.level = process.env.NEURONDB_LOG_LEVEL as any;
		}
		if (process.env.NEURONDB_LOG_FORMAT) {
			merged.logging.format = process.env.NEURONDB_LOG_FORMAT as any;
		}
		if (process.env.NEURONDB_LOG_OUTPUT) {
			merged.logging.output = process.env.NEURONDB_LOG_OUTPUT;
		}

		// Feature flags from env
		if (process.env.NEURONDB_ENABLE_GPU) {
			if (merged.features.ml) {
				merged.features.ml.gpuEnabled = process.env.NEURONDB_ENABLE_GPU === "true";
			}
		}

		return merged;
	}
}





