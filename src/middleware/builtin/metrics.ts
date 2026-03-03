/**
 * Metrics collection middleware
 */

import { Middleware, MCPRequest, MCPResponse } from "../types.js";
import { Logger } from "../../logging/logger.js";

interface Metrics {
	requestCount: number;
	errorCount: number;
	totalDuration: number;
	methodCounts: Record<string, number>;
	averageDuration?: number;
}

export class MetricsCollector {
	private metrics: Metrics = {
		requestCount: 0,
		errorCount: 0,
		totalDuration: 0,
		methodCounts: {},
	};

	incrementRequest(method: string): void {
		this.metrics.requestCount++;
		this.metrics.methodCounts[method] = (this.metrics.methodCounts[method] || 0) + 1;
	}

	incrementError(): void {
		this.metrics.errorCount++;
	}

	addDuration(duration: number): void {
		this.metrics.totalDuration += duration;
	}

	getMetrics(): Metrics {
		return {
			...this.metrics,
			averageDuration: this.metrics.requestCount > 0 ? this.metrics.totalDuration / this.metrics.requestCount : 0,
		};
	}

	reset(): void {
		this.metrics = {
			requestCount: 0,
			errorCount: 0,
			totalDuration: 0,
			methodCounts: {},
		};
	}
}

export function createMetricsMiddleware(collector: MetricsCollector, logger: Logger): Middleware {
	return {
		name: "metrics",
		order: 50,
		handler: async (request: MCPRequest, next: () => Promise<MCPResponse>): Promise<MCPResponse> => {
			const start = Date.now();
			collector.incrementRequest(request.method);

			try {
				const response = await next();
				const duration = Date.now() - start;
				collector.addDuration(duration);

				if (response.isError) {
					collector.incrementError();
				}

				return {
					...response,
					metadata: {
						...response.metadata,
						duration,
					},
				};
			} catch (error) {
				const duration = Date.now() - start;
				collector.addDuration(duration);
				collector.incrementError();
				throw error;
			}
		},
	};
}





