import { LoggingConfig } from "./config.js";

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	context?: Record<string, any>;
	error?: {
		message: string;
		stack?: string;
	};
}

export class Logger {
	private config: LoggingConfig;
	private level: LogLevel;
	private output: NodeJS.WritableStream;

	constructor(config: LoggingConfig) {
		this.config = config;
		this.level = this.parseLevel(config.level);
		
		if (config.output === "stdout") {
			this.output = process.stdout;
		} else if (config.output === "stderr") {
			this.output = process.stderr;
		} else {
			// For file output, would need fs.createWriteStream
			this.output = process.stderr;
		}
	}

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

	private shouldLog(level: LogLevel): boolean {
		return level >= this.level;
	}

	private formatMessage(entry: LogEntry): string {
		if (this.config.format === "json") {
			return JSON.stringify(entry);
		}

		// Text format
		const parts = [
			entry.timestamp,
			`[${entry.level}]`,
			entry.message,
		];

		if (entry.context && Object.keys(entry.context).length > 0) {
			parts.push(JSON.stringify(entry.context));
		}

		if (entry.error) {
			parts.push(`Error: ${entry.error.message}`);
			if (this.config.enableErrorStack && entry.error.stack) {
				parts.push(`\n${entry.error.stack}`);
			}
		}

		return parts.join(" ");
	}

	private log(level: LogLevel, levelName: string, message: string, context?: Record<string, any>, error?: Error) {
		if (!this.shouldLog(level)) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level: levelName,
			message,
			context,
			error: error ? {
				message: error.message,
				stack: this.config.enableErrorStack ? error.stack : undefined,
			} : undefined,
		};

		const formatted = this.formatMessage(entry);
		this.output.write(formatted + "\n");
	}

	debug(message: string, context?: Record<string, any>) {
		this.log(LogLevel.DEBUG, "DEBUG", message, context);
	}

	info(message: string, context?: Record<string, any>) {
		this.log(LogLevel.INFO, "INFO", message, context);
	}

	warn(message: string, context?: Record<string, any>) {
		this.log(LogLevel.WARN, "WARN", message, context);
	}

	error(message: string, error?: Error, context?: Record<string, any>) {
		this.log(LogLevel.ERROR, "ERROR", message, context, error);
	}

	request(method: string, path: string, params?: any) {
		if (this.config.enableRequestLogging) {
			this.debug("Request", {
				method,
				path,
				params: this.sanitizeParams(params),
			});
		}
	}

	response(method: string, path: string, duration: number, success: boolean) {
		if (this.config.enableResponseLogging) {
			this.debug("Response", {
				method,
				path,
				duration: `${duration}ms`,
				success,
			});
		}
	}

	private sanitizeParams(params: any): any {
		if (!params) return params;
		const sanitized = { ...params };
		// Remove sensitive fields
		if (sanitized.password) sanitized.password = "***";
		if (sanitized.connectionString) sanitized.connectionString = "***";
		return sanitized;
	}
}

