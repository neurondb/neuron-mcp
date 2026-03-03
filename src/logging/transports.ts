/**
 * Log transports for different output destinations
 */

import { writeFileSync, appendFileSync, existsSync } from "fs";

export class LogTransport {
	constructor(private output: "stdout" | "stderr" | string) {}

	/**
	 * Write log message
	 */
	write(message: string): void {
		if (this.output === "stdout") {
			process.stdout.write(message);
		} else if (this.output === "stderr") {
			process.stderr.write(message);
		} else {
			// File output
			try {
				if (existsSync(this.output)) {
					appendFileSync(this.output, message);
				} else {
					writeFileSync(this.output, message);
				}
			} catch (error) {
				// Fallback to stderr if file write fails
				const errorMessage = error instanceof Error ? error.message : String(error);
				process.stderr.write(`Failed to write log message to file "${this.output}": ${errorMessage}\nOriginal message: ${message}`);
			}
		}
	}
}





