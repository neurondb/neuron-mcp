/**
 * Configuration validator with comprehensive validation
 */

import { ServerConfig, DatabaseConfig, FeaturesConfig, ServerSettings, LoggingConfig } from "./schema.js";

export class ConfigValidator {
	/**
	 * Validate complete server configuration
	 */
	static validate(config: ServerConfig): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Validate database config
		const dbErrors = this.validateDatabase(config.database);
		errors.push(...dbErrors);

		// Validate server settings
		const serverErrors = this.validateServer(config.server);
		errors.push(...serverErrors);

		// Validate logging
		const loggingErrors = this.validateLogging(config.logging);
		errors.push(...loggingErrors);

		// Validate features
		const featureErrors = this.validateFeatures(config.features);
		errors.push(...featureErrors);

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Validate database configuration
	 */
	private static validateDatabase(config: DatabaseConfig): string[] {
		const errors: string[] = [];

		if (!config.connectionString && !config.host) {
			errors.push("Database configuration must have either connectionString or host");
		}

		if (config.port !== undefined && (config.port < 1 || config.port > 65535)) {
			errors.push("Database port must be between 1 and 65535");
		}

		if (config.pool) {
			if (config.pool.min !== undefined && config.pool.min < 0) {
				errors.push("Pool min connections must be >= 0");
			}
			if (config.pool.max !== undefined && config.pool.max < 1) {
				errors.push("Pool max connections must be >= 1");
			}
			if (
				config.pool.min !== undefined &&
				config.pool.max !== undefined &&
				config.pool.min > config.pool.max
			) {
				errors.push("Pool min connections must be <= max connections");
			}
			if (config.pool.idleTimeoutMillis !== undefined && config.pool.idleTimeoutMillis < 0) {
				errors.push("Pool idleTimeoutMillis must be >= 0");
			}
			if (
				config.pool.connectionTimeoutMillis !== undefined &&
				config.pool.connectionTimeoutMillis < 0
			) {
				errors.push("Pool connectionTimeoutMillis must be >= 0");
			}
		}

		return errors;
	}

	/**
	 * Validate server settings
	 */
	private static validateServer(config: ServerSettings): string[] {
		const errors: string[] = [];

		if (config.timeout !== undefined && config.timeout < 0) {
			errors.push("Server timeout must be >= 0");
		}

		if (config.maxRequestSize !== undefined && config.maxRequestSize < 0) {
			errors.push("Server maxRequestSize must be >= 0");
		}

		return errors;
	}

	/**
	 * Validate logging configuration
	 */
	private static validateLogging(config: LoggingConfig): string[] {
		const errors: string[] = [];

		const validLevels = ["debug", "info", "warn", "error"];
		if (!validLevels.includes(config.level)) {
			errors.push(`Logging level must be one of: ${validLevels.join(", ")}`);
		}

		const validFormats = ["json", "text"];
		if (!validFormats.includes(config.format)) {
			errors.push(`Logging format must be one of: ${validFormats.join(", ")}`);
		}

		return errors;
	}

	/**
	 * Validate features configuration
	 */
	private static validateFeatures(config: FeaturesConfig): string[] {
		const errors: string[] = [];

		if (config.vector?.enabled) {
			if (config.vector.maxVectorDimension !== undefined && config.vector.maxVectorDimension < 1) {
				errors.push("Vector maxVectorDimension must be >= 1");
			}
			if (config.vector.defaultLimit !== undefined && config.vector.defaultLimit < 1) {
				errors.push("Vector defaultLimit must be >= 1");
			}
		}

		if (config.ml?.enabled) {
			if (config.ml.maxTrainingTime !== undefined && config.ml.maxTrainingTime < 0) {
				errors.push("ML maxTrainingTime must be >= 0");
			}
		}

		if (config.analytics?.enabled) {
			if (config.analytics.maxClusters !== undefined && config.analytics.maxClusters < 1) {
				errors.push("Analytics maxClusters must be >= 1");
			}
			if (config.analytics.maxIterations !== undefined && config.analytics.maxIterations < 1) {
				errors.push("Analytics maxIterations must be >= 1");
			}
		}

		if (config.rag?.enabled) {
			if (config.rag.defaultChunkSize !== undefined && config.rag.defaultChunkSize < 1) {
				errors.push("RAG defaultChunkSize must be >= 1");
			}
			if (config.rag.defaultOverlap !== undefined && config.rag.defaultOverlap < 0) {
				errors.push("RAG defaultOverlap must be >= 0");
			}
		}

		if (config.projects?.enabled) {
			if (config.projects.maxProjects !== undefined && config.projects.maxProjects < 1) {
				errors.push("Projects maxProjects must be >= 1");
			}
		}

		return errors;
	}
}





