/**
 * Base resource class
 */

import { Database } from "../database/connection.js";

export abstract class BaseResource {
	constructor(protected db: Database) {}

	abstract getUri(): string;
	abstract getName(): string;
	abstract getDescription(): string;
	abstract getMimeType(): string;
	abstract getContent(): Promise<any>;
}





