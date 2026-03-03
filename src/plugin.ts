import { Logger } from "./logging/logger.js";
import { PluginConfig } from "./config/schema.js";
import { Database } from "./database/connection.js";
import { MiddlewareManager } from "./middleware/manager.js";

export interface Plugin {
	name: string;
	version?: string;
	initialize?: (config: any, db: Database, logger: Logger, middleware: MiddlewareManager) => Promise<void>;
	tools?: Array<{
		name: string;
		description: string;
		inputSchema: any;
		handler: (params: any) => Promise<any>;
	}>;
	resources?: Array<{
		uri: string;
		name: string;
		description: string;
		mimeType: string;
		handler: () => Promise<any>;
	}>;
	middleware?: Array<{
		name: string;
		order?: number;
		handler: any;
	}>;
	shutdown?: () => Promise<void>;
}

export class PluginManager {
	private plugins: Map<string, Plugin> = new Map();
	private logger: Logger;
	private db: Database;
	private middleware: MiddlewareManager;

	constructor(logger: Logger, db: Database, middleware: MiddlewareManager) {
		this.logger = logger;
		this.db = db;
		this.middleware = middleware;
	}

	async loadPlugin(config: PluginConfig): Promise<void> {
		if (!config.enabled) {
			this.logger.debug(`Plugin ${config.name} is disabled`);
			return;
		}

		try {
			let plugin: Plugin | null = null;

			if (config.path) {
				// Load from file
				const module = await import(config.path);
				plugin = module.default || module;
			} else {
				// Try to load from built-in plugins
				plugin = await this.loadBuiltInPlugin(config.name);
			}

			if (!plugin) {
				throw new Error(`Plugin ${config.name} not found`);
			}

			// Initialize plugin
			if (plugin.initialize) {
				await plugin.initialize(config.config || {}, this.db, this.logger, this.middleware);
			}

			// Register middleware
			if (plugin.middleware) {
				for (const mw of plugin.middleware) {
					this.middleware.register(mw);
				}
			}

			this.plugins.set(config.name, plugin);
			this.logger.info(`Loaded plugin: ${config.name}`, { version: plugin.version });
		} catch (error) {
			this.logger.error(`Failed to load plugin ${config.name}`, error as Error);
			throw error;
		}
	}

	private async loadBuiltInPlugin(name: string): Promise<Plugin | null> {
		// Built-in plugins would be loaded here
		// For now, return null to indicate no built-in plugin
		return null as Plugin | null;
	}

	getPlugin(name: string): Plugin | undefined {
		return this.plugins.get(name);
	}

	getAllPlugins(): Plugin[] {
		return Array.from(this.plugins.values());
	}

	getAllTools(): Array<{
		name: string;
		description: string;
		inputSchema: any;
		handler: (params: any) => Promise<any>;
	}> {
		const tools: Array<{
			name: string;
			description: string;
			inputSchema: any;
			handler: (params: any) => Promise<any>;
		}> = [];

		for (const plugin of this.plugins.values()) {
			if (plugin.tools) {
				tools.push(...plugin.tools);
			}
		}

		return tools;
	}

	getAllResources(): Array<{
		uri: string;
		name: string;
		description: string;
		mimeType: string;
		handler: () => Promise<any>;
	}> {
		const resources: Array<{
			uri: string;
			name: string;
			description: string;
			mimeType: string;
			handler: () => Promise<any>;
		}> = [];

		for (const plugin of this.plugins.values()) {
			if (plugin.resources) {
				resources.push(...plugin.resources);
			}
		}

		return resources;
	}

	async shutdown(): Promise<void> {
		for (const plugin of this.plugins.values()) {
			if (plugin.shutdown) {
				try {
					await plugin.shutdown();
				} catch (error) {
					this.logger.error(`Error shutting down plugin ${plugin.name}`, error as Error);
				}
			}
		}
		this.plugins.clear();
	}
}

