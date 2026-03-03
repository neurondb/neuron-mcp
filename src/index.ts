#!/usr/bin/env node
/*-------------------------------------------------------------------------
 *
 * index.ts
 *    Main entry point for NeuronMCP server
 *
 * Initializes the MCP server with database connection, resources, tools,
 * and middleware. Handles server lifecycle and protocol communication.
 *
 * Copyright (c) 2024-2026, neurondb, Inc.
 *
 * IDENTIFICATION
 *    NeuronMCP/src/index.ts
 *
 *-------------------------------------------------------------------------
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListResourcesRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Database } from "./database/connection.js";
import { Resources } from "./resources/index.js";
import { ConfigManager } from "./config/manager.js";
import { Logger } from "./logging/logger.js";
import { MiddlewareManager } from "./middleware/manager.js";
import { PluginManager } from "./plugin.js";
import {
	createLoggingMiddleware,
	createErrorHandlingMiddleware,
	createValidationMiddleware,
	createTimeoutMiddleware,
} from "./middleware/builtin/index.js";
import { ToolRegistry } from "./tools/registry.js";
import { registerAllTools } from "./tools/registry_integration.js";
import type { MCPRequest, MCPResponse } from "./middleware/types.js";

class NeurondbMCPServer {
	private server: Server;
	private db: Database;
	private resources: Resources;
	private config: ConfigManager;
	private logger: Logger;
	private middleware: MiddlewareManager;
	private pluginManager: PluginManager;
	private toolRegistry: ToolRegistry;

	constructor() {
		// Load configuration
		this.config = new ConfigManager();
		const serverConfig = this.config.load();

		// Initialize logger
		this.logger = new Logger(this.config.getLoggingConfig());

		// Initialize database
		this.db = new Database();

		// Initialize middleware
		this.middleware = new MiddlewareManager(this.logger);
		this.setupBuiltInMiddleware();

		// Initialize plugin manager
		this.pluginManager = new PluginManager(this.logger, this.db, this.middleware);

		// Initialize server
		const serverSettings = this.config.getServerSettings();
		this.server = new Server(
			{
				name: serverSettings.name || "neurondb-mcp-server",
				version: serverSettings.version || "1.0.0",
			},
			{
				capabilities: {
					tools: {},
					resources: {},
				},
			}
		);

		// Initialize resources
		this.resources = new Resources(this.db);

		// Initialize tool registry
		this.toolRegistry = new ToolRegistry(this.db, this.logger);

		this.setupHandlers();
	}

	private setupBuiltInMiddleware() {
		const serverSettings = this.config.getServerSettings();
		const loggingConfig = this.config.getLoggingConfig();

		// Add built-in middleware - import at top level
		this.middleware.register(createValidationMiddleware());
		this.middleware.register(
			createLoggingMiddleware(
				this.logger,
				loggingConfig.enableRequestLogging ?? true,
				loggingConfig.enableResponseLogging ?? false
			)
		);
		
		if (serverSettings.timeout) {
			this.middleware.register(createTimeoutMiddleware(serverSettings.timeout, this.logger));
		}
		
		this.middleware.register(
			createErrorHandlingMiddleware(this.logger, loggingConfig.enableErrorStack ?? false)
		);
	}

	private setupHandlers() {
		this.setupTools();
		this.setupResources();
		this.setupToolHandlers();
	}

	private setupTools() {
		// Register all tools with registry
		registerAllTools(this.toolRegistry, this.db, this.logger);

		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			const features = this.config.getFeaturesConfig();
			const allDefinitions = this.toolRegistry.getAllDefinitions();

			// Get plugin tools
			const pluginTools = this.pluginManager.getAllTools();
			const pluginToolDefinitions = pluginTools.map((tool) => ({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
			}));

			// Filter tools based on feature flags
			const enabledTools = allDefinitions.filter((tool) => {
				// PostgreSQL tools - always enabled by default
				if (tool.name.startsWith("postgresql_")) {
					return true;
				}
				if (tool.name.startsWith("vector_") || tool.name.startsWith("embed_")) {
					return features.vector?.enabled !== false;
				}
				if (tool.name.startsWith("train_") || tool.name.startsWith("predict_")) {
					return features.ml?.enabled !== false;
				}
				if (tool.name.startsWith("cluster_") || tool.name.startsWith("detect_")) {
					return features.analytics?.enabled !== false;
				}
				if (tool.name.startsWith("gpu_")) {
					return features.gpu?.enabled !== false;
				}
				if (tool.name.startsWith("rag_")) {
					return features.rag?.enabled !== false;
				}
				if (tool.name.startsWith("project_") || tool.name.startsWith("create_ml_project")) {
					return features.projects?.enabled !== false;
				}
				return true;
			});

			// Combine registry tools and plugin tools
			return {
				tools: [...enabledTools, ...pluginToolDefinitions],
			};
		});
	}

	private setupResources() {
		this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
			const resources: any[] = [
					{
						uri: "neurondb://schema",
						name: "Neurondb Schema",
						description: "Database schema information",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://models",
						name: "ML Models Catalog",
						description: "List of registered ML models",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://indexes",
						name: "Vector Indexes",
						description: "Status and information about vector indexes",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://config",
						name: "Neurondb Configuration",
						description: "Current Neurondb configuration settings",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://workers",
						name: "Background Workers Status",
						description: "Status of background workers",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://vector_stats",
						name: "Vector Statistics",
						description: "Aggregate vector statistics",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://index_health",
						name: "Index Health",
						description: "Index health dashboard",
						mimeType: "application/json",
					},
			];

			// Add plugin resources
			const pluginResources = this.pluginManager.getAllResources();
			resources.push(...pluginResources);

			return { resources };
		});

		this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
				const { uri } = request.params;

				try {
					let data: any;

				// Check plugin resources first
				const pluginResources = this.pluginManager.getAllResources();
				const pluginResource = pluginResources.find((r) => r.uri === uri);
				if (pluginResource) {
					data = await pluginResource.handler();
				} else {
					// Built-in resources
					switch (uri) {
						case "neurondb://schema":
							data = await this.resources.getSchema();
							break;
						case "neurondb://models":
							data = await this.resources.getModels();
							break;
						case "neurondb://indexes":
							data = await this.resources.getIndexes();
							break;
						case "neurondb://config":
							data = await this.resources.getConfig();
							break;
						case "neurondb://workers":
							data = await this.resources.getWorkerStatus();
							break;
						case "neurondb://vector_stats":
							data = await this.resources.getVectorStats();
							break;
						case "neurondb://index_health":
							data = await this.resources.getIndexHealth();
							break;
						default:
							throw new Error(`Unknown resource URI: ${uri}`);
					}
					}

					return {
						contents: [
							{
								uri,
								mimeType: "application/json",
								text: JSON.stringify(data, null, 2),
							},
						],
					};
				} catch (error) {
					throw new Error(
						`Failed to read resource ${uri}: ${error instanceof Error ? error.message : String(error)}`
					);
				}
		});
	}

	private setupToolHandlers() {
		this.server.setRequestHandler(CallToolRequestSchema, async (request, _extra) => {
			return this.middleware.execute(
				{
					method: "tools/call",
					params: request.params,
				},
				async () => {
					try {
						// Check plugin tools first
						const pluginTools = this.pluginManager.getAllTools();
						const pluginTool = pluginTools.find((t) => t.name === request.params.name);
						if (pluginTool) {
							const result = await pluginTool.handler(request.params.arguments || {});
							return {
								content: [
									{
										type: "text",
										text: JSON.stringify(result, null, 2),
									},
								],
							};
						}

						// Use new tool registry if tool exists
						const tool = this.toolRegistry.getTool(request.params.name);
						if (tool) {
							const result = await tool.execute(request.params.arguments || {});
							if (result.success) {
								return {
									content: [
										{
											type: "text",
											text: JSON.stringify(result.data, null, 2),
										},
									],
									metadata: result.metadata,
								};
							} else {
								return {
									content: [
										{
											type: "text",
											text: `Error: ${result.error?.message || "Unknown error"}`,
										},
									],
									isError: true,
									metadata: result.error,
								};
							}
						}

						// Tool not found
						return {
							content: [
								{
									type: "text",
									text: `Tool not found: ${request.params.name}`,
								},
							],
							isError: true,
						};
					} catch (error) {
						this.logger.error(`Tool execution failed: ${request.params.name}`, error as Error);
						return {
							content: [
								{
									type: "text",
									text: `Error: ${error instanceof Error ? error.message : String(error)}`,
								},
							],
							isError: true,
						};
					}
				}
			);
		});
	}


	async connect() {
		try {
			const dbConfig = this.config.getDatabaseConfig();
			this.db.connect(dbConfig);
			await this.db.testConnection();
			this.logger.info("Connected to database", {
				host: dbConfig.host,
				database: dbConfig.database,
			});
		} catch (error) {
			this.logger.error("Failed to connect to database", error as Error);
			throw error;
		}
	}

	async loadPlugins() {
		const plugins = this.config.getPlugins();
		for (const pluginConfig of plugins) {
			try {
				await this.pluginManager.loadPlugin(pluginConfig);
			} catch (error) {
				this.logger.error(`Failed to load plugin: ${pluginConfig.name}`, error as Error);
			}
		}
	}

	async start() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);

		// Load plugins
		await this.loadPlugins();

		// Connect to database
		try {
			await this.connect();
		} catch (error) {
			this.logger.warn("Database connection failed, server will start but tools may fail");
		}

		this.logger.info("Neurondb MCP server running on stdio");
	}

	async stop() {
		this.logger.info("Shutting down server");
		await this.pluginManager.shutdown();
		await this.db.close();
	}
}

const server = new NeurondbMCPServer();
server.start().catch((error) => {
	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;
	process.stderr.write(`Fatal error occurred during NeuronMCP server startup: ${errorMessage}\n`);
	if (errorStack) {
		process.stderr.write(`Stack trace:\n${errorStack}\n`);
	}
	process.exit(1);
});

process.on("SIGINT", async () => {
	await server.stop();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await server.stop();
	process.exit(0);
});

