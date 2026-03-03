/**
 * Request/response logging middleware
 */

import { Middleware, MCPRequest, MCPResponse } from "../types.js";
import { Logger } from "../../logging/logger.js";

export function createLoggingMiddleware(logger: Logger, enableRequestLogging: boolean = true, enableResponseLogging: boolean = false): Middleware {
	return {
		name: "logging",
		order: 2,
		handler: async (request: MCPRequest, next: () => Promise<MCPResponse>): Promise<MCPResponse> => {
			const start = Date.now();

			if (enableRequestLogging) {
				logger.info(`Request: ${request.method}`, {
					params: request.params,
					metadata: request.metadata,
				});
			}

			try {
				const response = await next();
				const duration = Date.now() - start;

				if (enableResponseLogging) {
					logger.info(`Response: ${request.method}`, {
						duration,
						success: !response.isError,
						metadata: response.metadata,
					});
				}

				return response;
			} catch (error) {
				const duration = Date.now() - start;
				logger.error(`Request failed: ${request.method}`, error as Error, {
					duration,
					params: request.params,
				});
				throw error;
			}
		},
	};
}





