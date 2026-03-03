/**
 * Query builder utilities for safe SQL construction
 */

export class QueryBuilder {
	/**
	 * Build SELECT query
	 */
	static select(
		table: string,
		columns: string[] = ["*"],
		where?: Record<string, any>,
		orderBy?: { column: string; direction?: "ASC" | "DESC" },
		limit?: number,
		offset?: number
	): { query: string; params: any[] } {
		const params: any[] = [];
		let paramIndex = 1;

		// SELECT clause
		const selectClause = columns.map((col) => this.escapeIdentifier(col)).join(", ");

		// FROM clause
		const fromClause = this.escapeIdentifier(table);

		// WHERE clause
		let whereClause = "";
		if (where && Object.keys(where).length > 0) {
			const conditions = Object.entries(where).map(([key, value]) => {
				const escapedKey = this.escapeIdentifier(key);
				if (Array.isArray(value)) {
					return `${escapedKey} = ANY($${paramIndex++})`;
				} else {
					return `${escapedKey} = $${paramIndex++}`;
				}
			});
			whereClause = `WHERE ${conditions.join(" AND ")}`;
			params.push(...Object.values(where));
		}

		// ORDER BY clause
		let orderByClause = "";
		if (orderBy) {
			orderByClause = `ORDER BY ${this.escapeIdentifier(orderBy.column)} ${orderBy.direction || "ASC"}`;
		}

		// LIMIT clause
		let limitClause = "";
		if (limit !== undefined) {
			limitClause = `LIMIT $${paramIndex++}`;
			params.push(limit);
		}

		// OFFSET clause
		let offsetClause = "";
		if (offset !== undefined) {
			offsetClause = `OFFSET $${paramIndex++}`;
			params.push(offset);
		}

		const query = [
			`SELECT ${selectClause}`,
			`FROM ${fromClause}`,
			whereClause,
			orderByClause,
			limitClause,
			offsetClause,
		]
			.filter(Boolean)
			.join(" ");

		return { query, params };
	}

	/**
	 * Build INSERT query
	 */
	static insert(table: string, data: Record<string, any>): { query: string; params: any[] } {
		const columns = Object.keys(data);
		const values = Object.values(data);
		const params: any[] = [];

		const columnList = columns.map((col) => this.escapeIdentifier(col)).join(", ");
		const valuePlaceholders = values.map((_, i) => `$${i + 1}`).join(", ");
		params.push(...values);

		const query = `INSERT INTO ${this.escapeIdentifier(table)} (${columnList}) VALUES (${valuePlaceholders}) RETURNING *`;

		return { query, params };
	}

	/**
	 * Build UPDATE query
	 */
	static update(
		table: string,
		data: Record<string, any>,
		where: Record<string, any>
	): { query: string; params: any[] } {
		const params: any[] = [];
		let paramIndex = 1;

		const setClause = Object.entries(data)
			.map(([key]) => {
				return `${this.escapeIdentifier(key)} = $${paramIndex++}`;
			})
			.join(", ");
		params.push(...Object.values(data));

		const whereConditions = Object.entries(where)
			.map(([key]) => {
				return `${this.escapeIdentifier(key)} = $${paramIndex++}`;
			})
			.join(" AND ");
		params.push(...Object.values(where));

		const query = `UPDATE ${this.escapeIdentifier(table)} SET ${setClause} WHERE ${whereConditions} RETURNING *`;

		return { query, params };
	}

	/**
	 * Build DELETE query
	 */
	static delete(table: string, where: Record<string, any>): { query: string; params: any[] } {
		const params: any[] = [];
		let paramIndex = 1;

		const whereConditions = Object.entries(where)
			.map(([key]) => {
				return `${this.escapeIdentifier(key)} = $${paramIndex++}`;
			})
			.join(" AND ");
		params.push(...Object.values(where));

		const query = `DELETE FROM ${this.escapeIdentifier(table)} WHERE ${whereConditions} RETURNING *`;

		return { query, params };
	}

	/**
	 * Escape SQL identifier
	 */
	static escapeIdentifier(identifier: string): string {
		return `"${identifier.replace(/"/g, '""')}"`;
	}

	/**
	 * Build vector search query
	 */
	static vectorSearch(
		table: string,
		vectorColumn: string,
		queryVector: number[],
		distanceMetric: "l2" | "cosine" | "inner_product" | "l1" | "hamming" | "chebyshev" | "minkowski" = "l2",
		limit: number = 10,
		additionalColumns: string[] = [],
		minkowskiP?: number
	): { query: string; params: any[] } {
		const vectorStr = `[${queryVector.join(",")}]`;
		let operator = "<->";
		let distanceFunction = "vector_l2_distance";
		const params: any[] = [vectorStr];

		switch (distanceMetric) {
			case "cosine":
				operator = "<=>";
				distanceFunction = "vector_cosine_distance";
				break;
			case "inner_product":
				operator = "<#>";
				distanceFunction = "vector_inner_product";
				break;
			case "l1":
				distanceFunction = "vector_l1_distance";
				break;
			case "hamming":
				distanceFunction = "vector_hamming_distance";
				break;
			case "chebyshev":
				distanceFunction = "vector_chebyshev_distance";
				break;
			case "minkowski":
				distanceFunction = "vector_minkowski_distance";
				if (minkowskiP === undefined) {
					minkowskiP = 2;
				}
				params.push(minkowskiP);
				break;
		}

		const selectColumns = ["*", ...additionalColumns.map((col) => this.escapeIdentifier(col))];
		
		// For operators, use operator syntax; for functions, use function call
		let distanceExpr: string;
		if (distanceMetric === "minkowski") {
			distanceExpr = `${distanceFunction}(${this.escapeIdentifier(vectorColumn)}, $1::vector, $2::double precision) AS distance`;
		} else if (["l1", "hamming", "chebyshev"].includes(distanceMetric)) {
			distanceExpr = `${distanceFunction}(${this.escapeIdentifier(vectorColumn)}, $1::vector) AS distance`;
		} else {
			distanceExpr = `${this.escapeIdentifier(vectorColumn)} ${operator} $1::vector AS distance`;
		}

		params.push(limit);

		const query = `
			SELECT ${selectColumns.join(", ")}, ${distanceExpr}
			FROM ${this.escapeIdentifier(table)}
			ORDER BY distance
			LIMIT $${params.length}
		`;

		return { query, params };
	}
}

