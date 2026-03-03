import { Logger } from "./logger.js";
import { MiddlewareConfig } from "./config.js";

export interface MCPRequest {
	method: string;
	params?: any;
}

export interface MCPResponse {
	content?: any[];
	isError?: boolean;
}

export type MiddlewareFunction = (
	request: MCPRequest,
	next: () => Promise<MCPResponse>
) => Promise<MCPResponse>;

export interface Middleware {
	name: string;
	order?: number;
	handler: MiddlewareFunction;
}

export class MiddlewareManager {
	private middlewares: Middleware[] = [];
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	register(middleware: Middleware) {
		this.middlewares.push(middleware);
		this.middlewares.sort((a, b) => (a.order || 0) - (b.order || 0));
		this.logger.debug(`Registered middleware: ${middleware.name}`);
	}

	async execute(request: MCPRequest, handler: () => Promise<MCPResponse>): Promise<MCPResponse> {
		let index = 0;

		const next = async (): Promise<MCPResponse> => {
			if (index >= this.middlewares.length) {
				return handler();
			}

			const middleware = this.middlewares[index++];
			return middleware.handler(request, next);
		};

		return next();
	}

	clear() {
		this.middlewares = [];
	}
}

// Built-in middleware
export const createLoggingMiddleware = (logger: Logger): Middleware => ({
	name: "logging",
	order: 1,
	handler: async (request, next) => {
		const start = Date.now();
		logger.request(request.method, "mcp", request.params);
		
		try {
			const response = await next();
			const duration = Date.now() - start;
			logger.response(request.method, "mcp", duration, !response.isError);
			return response;
		} catch (error) {
			const duration = Date.now() - start;
			logger.error(`Request failed: ${request.method}`, error as Error, { duration });
			throw error;
		}
	},
});

export const createErrorHandlingMiddleware = (logger: Logger): Middleware => ({
	name: "error-handling",
	order: 100,
	handler: async (request, next) => {
		try {
			return await next();
		} catch (error) {
			logger.error(`Unhandled error in ${request.method}`, error as Error);
			return {
				content: [{
					type: "text",
					text: `Error: ${error instanceof Error ? error.message : String(error)}`,
				}],
				isError: true,
			};
		}
	},
});

export const createValidationMiddleware = (): Middleware => ({
	name: "validation",
	order: 2,
	handler: async (request, next) => {
		// Basic validation
		if (!request.method) {
			throw new Error("Missing method in request");
		}
		return next();
	},
});

export const createTimeoutMiddleware = (timeout: number, logger: Logger): Middleware => ({
	name: "timeout",
	order: 3,
	handler: async (request, next) => {
		return Promise.race([
			next(),
			new Promise<MCPResponse>((_, reject) => {
				setTimeout(() => {
					reject(new Error(`Request timeout after ${timeout}ms`));
				}, timeout);
			}),
		]);
	},
});

