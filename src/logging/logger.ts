/**
 * Enhanced Logger class with formatters and transports
 */

import { LoggingConfig } from "../config/schema.js";
import { LogFormatter } from "./formatters.js";
import { LogTransport } from "./transports.js";
import { LogLevel } from "./levels.js";

export class Logger {
	private formatter: LogFormatter;
	private transport: LogTransport;
	private level: LogLevel;

	constructor(config: LoggingConfig) {
		this.level = this.parseLevel(config.level);
		this.formatter = new LogFormatter(config.format);
		this.transport = new LogTransport(config.output || "stderr");
	}

	/**
	 * Log debug message
	 */
	debug(message: string, metadata?: Record<string, any>): void {
		this.log(LogLevel.DEBUG, message, metadata);
	}

	/**
	 * Log info message
	 */
	info(message: string, metadata?: Record<string, any>): void {
		this.log(LogLevel.INFO, message, metadata);
	}

	/**
	 * Log warning message
	 */
	warn(message: string, metadata?: Record<string, any>): void {
		this.log(LogLevel.WARN, message, metadata);
	}

	/**
	 * Log error message
	 */
	error(message: string, error?: Error, metadata?: Record<string, any>): void {
		const errorMetadata = error
			? {
					...metadata,
					error: {
						message: error.message,
						stack: error.stack,
						name: error.name,
					},
				}
			: metadata;
		this.log(LogLevel.ERROR, message, errorMetadata);
	}

	/**
	 * Internal log method
	 */
	private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
		if (level < this.level) {
			return;
		}

		const logEntry = {
			timestamp: new Date().toISOString(),
			level: LogLevel[level],
			message,
			...(metadata || {}),
		};

		const formatted = this.formatter.format(logEntry);
		this.transport.write(formatted);
	}

	/**
	 * Parse log level string to enum
	 */
	private parseLevel(level: string): LogLevel {
		switch (level.toLowerCase()) {
			case "debug":
				return LogLevel.DEBUG;
			case "info":
				return LogLevel.INFO;
			case "warn":
				return LogLevel.WARN;
			case "error":
				return LogLevel.ERROR;
			default:
				return LogLevel.INFO;
		}
	}

	/**
	 * Create child logger with additional metadata
	 */
	child(metadata: Record<string, any>): Logger {
		const childLogger = Object.create(this);
		childLogger.log = (level: LogLevel, message: string, childMetadata?: Record<string, any>) => {
			this.log(level, message, { ...metadata, ...childMetadata });
		};
		return childLogger;
	}
}





