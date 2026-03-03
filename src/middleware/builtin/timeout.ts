/**
 * Request timeout middleware
 */

import { Middleware, MCPRequest, MCPResponse } from "../types.js";
import { Logger } from "../../logging/logger.js";

export function createTimeoutMiddleware(timeout: number, logger: Logger): Middleware {
	return {
		name: "timeout",
		order: 3,
		handler: async (request: MCPRequest, next: () => Promise<MCPResponse>): Promise<MCPResponse> => {
			return Promise.race([
				next(),
				new Promise<MCPResponse>((_, reject) => {
					setTimeout(() => {
						const error = new Error(`Request timeout after ${timeout}ms`);
						logger.warn(`Request timeout: ${request.method}`, { timeout });
						reject(error);
					}, timeout);
				}),
			]);
		},
	};
}





