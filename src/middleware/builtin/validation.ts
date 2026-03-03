/**
 * Request validation middleware
 */

import { Middleware, MCPRequest, MCPResponse } from "../types.js";

export function createValidationMiddleware(): Middleware {
	return {
		name: "validation",
		order: 1,
		handler: async (request: MCPRequest, next: () => Promise<MCPResponse>): Promise<MCPResponse> => {
			// Basic validation
			if (!request.method) {
				return {
					content: [
						{
							type: "text",
							text: "Missing method in request",
						},
					],
					isError: true,
				};
			}

			// Validate params if present
			if (request.params && typeof request.params !== "object") {
				return {
					content: [
						{
							type: "text",
							text: "Invalid params: must be an object",
						},
					],
					isError: true,
				};
			}

			return next();
		},
	};
}





