/**
 * Middleware chain execution
 */

import { MCPRequest, MCPResponse, Middleware } from "./types.js";

export class MiddlewareChain {
	constructor(private middlewares: Middleware[]) {
		// Sort by order
		this.middlewares.sort((a, b) => (a.order || 0) - (b.order || 0));
	}

	/**
	 * Execute middleware chain
	 */
	async execute(request: MCPRequest, finalHandler: () => Promise<MCPResponse>): Promise<MCPResponse> {
		let index = 0;
		const enabledMiddlewares = this.middlewares.filter((m) => m.enabled !== false);

		const next = async (): Promise<MCPResponse> => {
			if (index >= enabledMiddlewares.length) {
				return finalHandler();
			}

			const middleware = enabledMiddlewares[index++];
			return middleware.handler(request, next);
		};

		return next();
	}
}





