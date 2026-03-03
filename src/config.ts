/*-------------------------------------------------------------------------
 *
 * config.ts
 *    Configuration management for NeuronMCP
 *
 * Handles loading and validation of server configuration from files and
 * environment variables. Provides type-safe configuration interfaces.
 *
 * Copyright (c) 2024-2026, neurondb, Inc.
 *
 * IDENTIFICATION
 *    NeuronMCP/src/config.ts
 *
 *-------------------------------------------------------------------------
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ServerConfig {
	database: DatabaseConfig;
	server: ServerSettings;
	logging: LoggingConfig;
	features: FeaturesConfig;
	plugins?: PluginConfig[];
	middleware?: MiddlewareConfig[];
}

export interface DatabaseConfig {
	connectionString?: string;
	host?: string;
	port?: number;
	database?: string;
	user?: string;
	password?: string;
	pool?: {
		min?: number;
		max?: number;
		idleTimeoutMillis?: number;
		connectionTimeoutMillis?: number;
	};
	ssl?: boolean | {
		rejectUnauthorized?: boolean;
		ca?: string;
		cert?: string;
		key?: string;
	};
}

export interface ServerSettings {
	name?: string;
	version?: string;
	timeout?: number;
	maxRequestSize?: number;
	enableMetrics?: boolean;
	enableHealthCheck?: boolean;
}

export interface LoggingConfig {
	level: "debug" | "info" | "warn" | "error";
	format: "json" | "text";
	output?: "stdout" | "stderr" | string;
	enableRequestLogging?: boolean;
	enableResponseLogging?: boolean;
	enableErrorStack?: boolean;
}

export interface FeaturesConfig {
	vector?: {
		enabled: boolean;
		defaultDistanceMetric?: "l2" | "cosine" | "inner_product";
		maxVectorDimension?: number;
		defaultLimit?: number;
	};
	ml?: {
		enabled: boolean;
		algorithms?: string[];
		maxTrainingTime?: number;
		gpuEnabled?: boolean;
	};
	analytics?: {
		enabled: boolean;
		maxClusters?: number;
		maxIterations?: number;
	};
	rag?: {
		enabled: boolean;
		defaultChunkSize?: number;
		defaultOverlap?: number;
	};
	projects?: {
		enabled: boolean;
		maxProjects?: number;
	};
}

export interface PluginConfig {
	name: string;
	enabled: boolean;
	path?: string;
	config?: Record<string, any>;
}

export interface MiddlewareConfig {
	name: string;
	enabled: boolean;
	order?: number;
	config?: Record<string, any>;
}

export class ConfigManager {
	private config: ServerConfig | null = null;
	private configPath: string | null = null;

	load(configPath?: string): ServerConfig {
		if (this.config) {
			return this.config;
		}

		// Try multiple config locations
		const possiblePaths = [
			configPath,
			process.env.NEURONDB_MCP_CONFIG,
			join(process.cwd(), "mcp-config.json"),
			join(__dirname, "..", "mcp-config.json"),
			join(process.env.HOME || "", ".neurondb", "mcp-config.json"),
		].filter(Boolean) as string[];

		for (const path of possiblePaths) {
			if (existsSync(path)) {
				try {
					const content = readFileSync(path, "utf-8");
					this.config = JSON.parse(content);
					this.configPath = path;
					// Configuration loaded successfully (using console.log for informational message)
					console.log(`Configuration loaded successfully from: ${path}`);
					break;
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					console.error(`Failed to load configuration file from path "${path}": ${errorMessage}`, error);
				}
			}
		}

		// Merge with environment variables
		this.config = this.mergeWithEnv(this.config || this.getDefaultConfig());

		return this.config;
	}

	private mergeWithEnv(config: ServerConfig): ServerConfig {
		// Database config from env
		if (process.env.NEURONDB_CONNECTION_STRING) {
			config.database.connectionString = process.env.NEURONDB_CONNECTION_STRING;
		}
		if (process.env.NEURONDB_HOST) {
			config.database.host = process.env.NEURONDB_HOST;
		}
		if (process.env.NEURONDB_PORT) {
			config.database.port = parseInt(process.env.NEURONDB_PORT);
		}
		if (process.env.NEURONDB_DATABASE) {
			config.database.database = process.env.NEURONDB_DATABASE;
		}
		if (process.env.NEURONDB_USER) {
			config.database.user = process.env.NEURONDB_USER;
		}
		if (process.env.NEURONDB_PASSWORD) {
			config.database.password = process.env.NEURONDB_PASSWORD;
		}

		// Logging config from env
		if (process.env.NEURONDB_LOG_LEVEL) {
			config.logging.level = process.env.NEURONDB_LOG_LEVEL as any;
		}
		if (process.env.NEURONDB_LOG_FORMAT) {
			config.logging.format = process.env.NEURONDB_LOG_FORMAT as any;
		}

		// Features from env
		if (process.env.NEURONDB_ENABLE_GPU === "true") {
			if (!config.features.ml) {
				config.features.ml = { enabled: true };
			}
			config.features.ml.gpuEnabled = true;
		}

		return config;
	}

	private getDefaultConfig(): ServerConfig {
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
					connectionTimeoutMillis: 2000,
				},
			},
			server: {
				name: "neurondb-mcp-server",
				version: "1.0.0",
				timeout: 30000,
				maxRequestSize: 10 * 1024 * 1024, // 10MB
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
					maxTrainingTime: 3600000, // 1 hour
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

	getConfig(): ServerConfig {
		if (!this.config) {
			return this.load();
		}
		return this.config;
	}

	getDatabaseConfig(): DatabaseConfig {
		return this.getConfig().database;
	}

	getServerSettings(): ServerSettings {
		return this.getConfig().server;
	}

	getLoggingConfig(): LoggingConfig {
		return this.getConfig().logging;
	}

	getFeaturesConfig(): FeaturesConfig {
		return this.getConfig().features;
	}

	getPlugins(): PluginConfig[] {
		return this.getConfig().plugins || [];
	}

	getMiddleware(): MiddlewareConfig[] {
		return this.getConfig().middleware || [];
	}

	isFeatureEnabled(feature: keyof FeaturesConfig): boolean {
		const features = this.getFeaturesConfig();
		const featureConfig = features[feature];
		return featureConfig ? (featureConfig as any).enabled !== false : false;
	}
}

