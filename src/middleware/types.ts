/**
 * Middleware types and interfaces
 */

export interface MCPRequest {
	method: string;
	params?: any;
	metadata?: Record<string, any>;
}

// MCP responses vary by request type (tools/resources/prompts/etc). Keep this
// intentionally broad so middleware can wrap any response shape.
export type MCPResponse = any;

export type MiddlewareFunction = (
	request: MCPRequest,
	next: () => Promise<MCPResponse>
) => Promise<MCPResponse>;

export interface Middleware {
	name: string;
	order?: number;
	enabled?: boolean;
	handler: MiddlewareFunction;
}



