import { Database } from "../db.js";

export class QuantizationTools {
	constructor(private db: Database) {}

	/**
	 * Quantize vector to INT8 (CPU)
	 */
	async quantizeINT8(vector: number[]) {
		const vecStr = `[${vector.join(",")}]`;
		const result = await this.db.query(
			"SELECT vector_to_int8($1::vector) AS quantized",
			[vecStr]
		);
		return { quantized: result.rows[0].quantized };
	}

	/**
	 * Quantize vector to FP16 (CPU)
	 */
	async quantizeFP16(vector: number[]) {
		const vecStr = `[${vector.join(",")}]`;
		const result = await this.db.query(
			"SELECT vector_to_fp16($1::vector) AS quantized",
			[vecStr]
		);
		return { quantized: result.rows[0].quantized };
	}

	/**
	 * Quantize vector to UINT8
	 */
	async quantizeUINT8(vector: number[]) {
		const vecStr = `[${vector.join(",")}]`;
		const result = await this.db.query(
			"SELECT vector_to_uint8($1::vector) AS quantized",
			[vecStr]
		);
		return { quantized: result.rows[0].quantized };
	}

	/**
	 * Quantize vector to binary
	 */
	async quantizeBinary(vector: number[]) {
		const vecStr = `[${vector.join(",")}]`;
		const result = await this.db.query(
			"SELECT vector_to_binary($1::vector) AS quantized",
			[vecStr]
		);
		return { quantized: result.rows[0].quantized };
	}

	/**
	 * Quantize vector to ternary
	 */
	async quantizeTernary(vector: number[]) {
		const vecStr = `[${vector.join(",")}]`;
		const result = await this.db.query(
			"SELECT vector_to_ternary($1::vector) AS quantized",
			[vecStr]
		);
		return { quantized: result.rows[0].quantized };
	}

	/**
	 * Train Product Quantization (PQ) codebook
	 */
	async trainPQCodebook(
		table: string,
		vectorColumn: string,
		numSubvectors: number,
		numCentroids: number,
		maxIter: number = 50
	) {
		const result = await this.db.query(
			"SELECT * FROM neurondb.train_pq_codebook($1, $2, $3, $4, $5)",
			[table, vectorColumn, numSubvectors, numCentroids, maxIter]
		);
		return result.rows;
	}

	/**
	 * Train Optimized Product Quantization (OPQ) codebook
	 */
	async trainOPQCodebook(
		table: string,
		vectorColumn: string,
		numSubvectors: number,
		numCentroids: number,
		maxIter: number = 50
	) {
		const result = await this.db.query(
			"SELECT * FROM neurondb.train_opq_codebook($1, $2, $3, $4, $5)",
			[table, vectorColumn, numSubvectors, numCentroids, maxIter]
		);
		return result.rows;
	}

	/**
	 * Encode vector using PQ codebook
	 */
	async encodePQ(
		vector: number[],
		numSubvectors: number,
		numCentroids: number,
		codebook: any[]
	) {
		const vecStr = `[${vector.join(",")}]`;
		const codebookArray = JSON.stringify(codebook);
		const result = await this.db.query(
			"SELECT neurondb.pq_encode_vector($1::vector, $2, $3, $4::vector[]) AS codes",
			[vecStr, numSubvectors, numCentroids, codebookArray]
		);
		return { codes: result.rows[0].codes };
	}
}

