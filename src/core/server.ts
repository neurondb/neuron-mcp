/**
 * Enhanced MCP server class
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ListResourcesRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Database } from "../database/connection.js";
import { ConfigManager } from "../config/manager.js";
import { Logger } from "../logging/logger.js";
import { MiddlewareManager } from "../middleware/manager.js";
import { ToolRegistry } from "../tools/registry.js";
import { registerAllTools } from "../tools/registry_integration.js";
import { Resources } from "../resources.js";
import {
	createValidationMiddleware,
	createLoggingMiddleware,
	createTimeoutMiddleware,
	createErrorHandlingMiddleware,
} from "../middleware/builtin/index.js";

export class NeurondbMCPServer {
	private server: Server;
	private db: Database;
	private config: ConfigManager;
	private logger: Logger;
	private middleware: MiddlewareManager;
	private toolRegistry: ToolRegistry;
	private resources: Resources;

	constructor() {
		// Load configuration
		this.config = new ConfigManager();
		const serverConfig = this.config.load();

		// Initialize logger
		this.logger = new Logger(this.config.getLoggingConfig());

		// Initialize database
		this.db = new Database();
		this.db.connect(this.config.getDatabaseConfig());

		// Initialize middleware
		this.middleware = new MiddlewareManager(this.logger);
		this.setupBuiltInMiddleware();

		// Initialize tool registry
		this.toolRegistry = new ToolRegistry(this.db, this.logger);

		// Initialize resources
		this.resources = new Resources(this.db);

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

		this.setupHandlers();
	}

	private setupBuiltInMiddleware() {
		const serverConfig = this.config.getConfig();
		const loggingConfig = this.config.getLoggingConfig();

		// Add built-in middleware
		this.middleware.register(createValidationMiddleware());
		this.middleware.register(
			createLoggingMiddleware(
				this.logger,
				loggingConfig.enableRequestLogging,
				loggingConfig.enableResponseLogging
			)
		);

		if (serverConfig.server.timeout) {
			this.middleware.register(createTimeoutMiddleware(serverConfig.server.timeout, this.logger));
		}

		this.middleware.register(
			createErrorHandlingMiddleware(this.logger, loggingConfig.enableErrorStack)
		);
	}

	private async setupHandlers() {
		await this.setupTools();
		this.setupResources();
		this.setupToolHandlers();
	}

	private async setupTools() {
		// Register all tools
		await registerAllTools(this.toolRegistry, this.db, this.logger);

		// Set up tool list handler
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			const features = this.config.getFeaturesConfig();
			const allDefinitions = this.toolRegistry.getAllDefinitions();

			// Filter tools based on feature flags
			const enabledTools = allDefinitions.filter((tool) => {
				// PostgreSQL tools - always enabled by default
				if (tool.name.startsWith("postgresql_")) {
					return true;
				}
				// Simple feature-based filtering - can be enhanced
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

			return {
				tools: enabledTools,
			};
		});
	}

	private setupResources() {
		this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
			return {
				resources: [
					{
						uri: "neurondb://schema",
						name: "Database Schema",
						description: "NeurondB database schema information",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://models",
						name: "ML Models",
						description: "Catalog of trained ML models",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://indexes",
						name: "Vector Indexes",
						description: "Status of vector indexes",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://config",
						name: "Configuration",
						description: "Current server configuration",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://workers",
						name: "Workers",
						description: "Background worker status",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://vector_stats",
						name: "Vector Statistics",
						description: "Vector column statistics",
						mimeType: "application/json",
					},
					{
						uri: "neurondb://index_health",
						name: "Index Health",
						description: "Index health dashboard",
						mimeType: "application/json",
					},
				],
			};
		});

		this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
			return this.resources.handleResource(request.params.uri);
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
					const { name, arguments: args } = request.params;

					const tool = this.toolRegistry.getTool(name);
					if (!tool) {
						return {
							content: [
								{
									type: "text",
									text: `Tool not found: ${name}`,
								},
							],
							isError: true,
						};
					}

					try {
						const result = await tool.execute(args || {});
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
					} catch (error) {
						this.logger.error(`Tool execution failed: ${name}`, error as Error, { args });
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

	async start() {
		const transport = new StdioServerTransport();
		await this.server.connect(transport);
		this.logger.info("NeurondB MCP Server started");
	}

	async stop() {
		await this.db.close();
		this.logger.info("NeurondB MCP Server stopped");
	}
}





