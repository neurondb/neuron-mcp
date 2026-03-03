/**
 * Log formatters for different output formats
 */

export interface LogEntry {
	timestamp: string;
	level: string;
	message: string;
	[key: string]: any;
}

export class LogFormatter {
	constructor(private formatType: "json" | "text") {}

	/**
	 * Format log entry
	 */
	format(entry: LogEntry): string {
		if (this.formatType === "json") {
			return JSON.stringify(entry) + "\n";
		} else {
			return this.formatText(entry);
		}
	}

	/**
	 * Format as text
	 */
	private formatText(entry: LogEntry): string {
		const { timestamp, level, message, ...metadata } = entry;
		const time = new Date(timestamp).toISOString();
		const levelStr = level.padEnd(5);
		let line = `${time} [${levelStr}] ${message}`;

		if (Object.keys(metadata).length > 0) {
			const metaStr = JSON.stringify(metadata);
			line += ` ${metaStr}`;
		}

		return line + "\n";
	}
}





