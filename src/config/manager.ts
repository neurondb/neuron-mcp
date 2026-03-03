/**
 * Enhanced configuration manager with validation
 */

import { ServerConfig } from "./schema.js";
import { ConfigLoader } from "./loader.js";
import { ConfigValidator } from "./validator.js";

export class ConfigManager {
	private config: ServerConfig | null = null;
	private configPath: string | null = null;

	/**
	 * Load configuration from file and environment
	 */
	load(configPath?: string): ServerConfig {
		if (this.config) {
			return this.config;
		}

		// Load from file or use defaults
		const fileConfig = ConfigLoader.loadFromFile(configPath);
		const baseConfig = fileConfig || ConfigLoader.getDefaultConfig();

		// Merge with environment variables
		this.config = ConfigLoader.mergeWithEnv(baseConfig);

		// Validate configuration
		const validation = ConfigValidator.validate(this.config);
		if (!validation.valid) {
			console.error("Configuration validation failed with the following errors:");
			validation.errors.forEach((error) => console.error(`  - ${error}`));
			throw new Error(`Invalid configuration: ${validation.errors.join("; ")}`);
		}

		return this.config;
	}

	/**
	 * Get current configuration
	 */
	getConfig(): ServerConfig {
		if (!this.config) {
			return this.load();
		}
		return this.config;
	}

	/**
	 * Get database configuration
	 */
	getDatabaseConfig() {
		return this.getConfig().database;
	}

	/**
	 * Get server settings
	 */
	getServerSettings() {
		return this.getConfig().server;
	}

	/**
	 * Get logging configuration
	 */
	getLoggingConfig() {
		return this.getConfig().logging;
	}

	/**
	 * Get features configuration
	 */
	getFeaturesConfig() {
		return this.getConfig().features;
	}

	/**
	 * Check if a feature is enabled
	 */
	isFeatureEnabled(feature: keyof ServerConfig["features"]): boolean {
		const features = this.getFeaturesConfig();
		return features[feature]?.enabled === true;
	}

	/**
	 * Get plugins configuration
	 */
	getPlugins() {
		return this.getConfig().plugins || [];
	}

	/**
	 * Reload configuration (for hot-reload if needed)
	 */
	reload(configPath?: string): ServerConfig {
		this.config = null;
		return this.load(configPath);
	}
}

