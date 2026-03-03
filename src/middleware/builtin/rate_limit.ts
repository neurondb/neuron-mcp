/**
 * Rate limiting middleware
 */

import { Middleware, MCPRequest, MCPResponse } from "../types.js";
import { Logger } from "../../logging/logger.js";

interface RateLimitConfig {
	maxRequests: number;
	windowMs: number;
}

interface RequestRecord {
	count: number;
	resetAt: number;
}

export class RateLimiter {
	private requests: Map<string, RequestRecord> = new Map();

	constructor(private config: RateLimitConfig, private logger: Logger) {}

	/**
	 * Check if request should be allowed
	 */
	check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
		const now = Date.now();
		const record = this.requests.get(key);

		if (!record || now > record.resetAt) {
			// Create new window
			const resetAt = now + this.config.windowMs;
			this.requests.set(key, {
				count: 1,
				resetAt,
			});
			return {
				allowed: true,
				remaining: this.config.maxRequests - 1,
				resetAt,
			};
		}

		if (record.count >= this.config.maxRequests) {
			return {
				allowed: false,
				remaining: 0,
				resetAt: record.resetAt,
			};
		}

		record.count++;
		return {
			allowed: true,
			remaining: this.config.maxRequests - record.count,
			resetAt: record.resetAt,
		};
	}

	/**
	 * Clean up old records
	 */
	cleanup(): void {
		const now = Date.now();
		for (const [key, record] of this.requests.entries()) {
			if (now > record.resetAt) {
				this.requests.delete(key);
			}
		}
	}
}

export function createRateLimitMiddleware(
	config: RateLimitConfig,
	logger: Logger
): Middleware {
	const limiter = new RateLimiter(config, logger);

	// Cleanup old records periodically
	setInterval(() => limiter.cleanup(), config.windowMs);

	return {
		name: "rate-limit",
		order: 1,
		handler: async (request: MCPRequest, next: () => Promise<MCPResponse>): Promise<MCPResponse> => {
			// Use method as rate limit key (can be enhanced to use IP, API key, etc.)
			const key = request.metadata?.apiKey || request.method || "default";
			const check = limiter.check(key);

			if (!check.allowed) {
				logger.warn(`Rate limit exceeded for ${key}`, {
					resetAt: new Date(check.resetAt).toISOString(),
				});

				return {
					content: [
						{
							type: "text",
							text: `Rate limit exceeded. Try again after ${new Date(check.resetAt).toISOString()}`,
						},
					],
					isError: true,
					metadata: {
						rateLimit: {
							remaining: check.remaining,
							resetAt: check.resetAt,
						},
					},
				};
			}

			return next();
		},
	};
}





