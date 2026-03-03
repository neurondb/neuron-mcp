/**
 * Enhanced MiddlewareManager
 */

import { Logger } from "../logging/logger.js";
import { Middleware, MCPRequest, MCPResponse } from "./types.js";
import { MiddlewareChain } from "./chain.js";

export class MiddlewareManager {
	private middlewares: Middleware[] = [];
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	/**
	 * Register middleware
	 */
	register(middleware: Middleware): void {
		this.middlewares.push(middleware);
		this.logger.debug(`Registered middleware: ${middleware.name}`, { order: middleware.order });
	}

	/**
	 * Register multiple middlewares
	 */
	registerAll(middlewares: Middleware[]): void {
		for (const middleware of middlewares) {
			this.register(middleware);
		}
	}

	/**
	 * Unregister middleware
	 */
	unregister(name: string): boolean {
		const index = this.middlewares.findIndex((m) => m.name === name);
		if (index !== -1) {
			this.middlewares.splice(index, 1);
			this.logger.debug(`Unregistered middleware: ${name}`);
			return true;
		}
		return false;
	}

	/**
	 * Enable/disable middleware
	 */
	setEnabled(name: string, enabled: boolean): boolean {
		const middleware = this.middlewares.find((m) => m.name === name);
		if (middleware) {
			middleware.enabled = enabled;
			this.logger.debug(`${enabled ? "Enabled" : "Disabled"} middleware: ${name}`);
			return true;
		}
		return false;
	}

	/**
	 * Execute middleware chain
	 */
	async execute(request: MCPRequest, handler: () => Promise<MCPResponse>): Promise<MCPResponse> {
		const chain = new MiddlewareChain(this.middlewares);
		return chain.execute(request, handler);
	}

	/**
	 * Get all registered middlewares
	 */
	getAll(): Middleware[] {
		return [...this.middlewares];
	}

	/**
	 * Clear all middlewares
	 */
	clear(): void {
		this.middlewares = [];
	}
}





