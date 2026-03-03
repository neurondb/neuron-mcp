/**
 * Error handling middleware
 */

import { Middleware, MCPRequest, MCPResponse } from "../types.js";
import { Logger } from "../../logging/logger.js";

export function createErrorHandlingMiddleware(logger: Logger, enableErrorStack: boolean = false): Middleware {
	return {
		name: "error-handling",
		order: 100,
		handler: async (request: MCPRequest, next: () => Promise<MCPResponse>): Promise<MCPResponse> => {
			try {
				return await next();
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				const errorStack = error instanceof Error && enableErrorStack ? error.stack : undefined;

				logger.error(`Unhandled error in ${request.method}`, error as Error, {
					method: request.method,
					params: request.params,
					stack: errorStack,
				});

				return {
					content: [
						{
							type: "text",
							text: `Error: ${errorMessage}${errorStack ? `\n${errorStack}` : ""}`,
						},
					],
					isError: true,
					metadata: {
						error: {
							message: errorMessage,
							...(errorStack ? { stack: errorStack } : {}),
						},
					},
				};
			}
		},
	};
}





