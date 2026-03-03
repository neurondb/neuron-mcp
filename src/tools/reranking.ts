import { Database } from "../db.js";
import type { ToolDefinition } from "./registry.js";

/**
 * RerankingTools - Comprehensive reranking support for NeuronDB
 * 
 * Provides MCP tools for all reranking methods:
 * - MMR (Maximal Marginal Relevance)
 * - Cross-Encoder
 * - LLM Reranking (with full parameter support)
 * - ColBERT
 * - RRF (Reciprocal Rank Fusion)
 * - Ensemble (Weighted and Borda)
 */
export class RerankingTools {
	private db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	/**
	 * Rerank using MMR (Maximal Marginal Relevance)
	 * Balances relevance and diversity in search results
	 */
	async mmrRerank(
		table: string,
		queryVector: number[],
		vectorColumn: string,
		lambda: number = 0.5,
		topK: number = 10
	): Promise<any[]> {
		const vecStr = `[${queryVector.join(",")}]`;
		const result = await this.db.query(
			"SELECT * FROM neurondb.mmr_rerank_with_scores($1, $2::vector, $3, $4, $5)",
			[table, vecStr, vectorColumn, lambda, topK]
		);
		return result.rows;
	}

	/**
	 * Rerank using Cross-Encoder neural model
	 * Uses cross-encoder models for fine-grained relevance scoring
	 */
	async rerankCrossEncoder(
		query: string,
		documents: string[],
		model?: string,
		topK?: number
	): Promise<any[]> {
		const modelName = model || "ms-marco-MiniLM-L-6-v2";
		const k = topK || documents.length;
		const result = await this.db.query(
			"SELECT * FROM neurondb.rerank_cross_encoder($1, $2::text[], $3, $4)",
			[query, documents, modelName, k]
		);
		return result.rows;
	}

	/**
	 * Rerank using LLM completion API
	 * GPT/Claude-powered reranking with full parameter support
	 */
	async rerankLLM(
		query: string,
		documents: string[],
		model?: string,
		topK?: number,
		promptTemplate?: string,
		temperature?: number
	): Promise<any[]> {
		const k = topK || documents.length;
		const temp = temperature !== undefined ? temperature : 0.0;
		
		// Build query with optional parameters
		let sql = "SELECT * FROM neurondb.rerank_llm($1, $2::text[]";
		const params: any[] = [query, documents];
		
		if (model) {
			sql += ", $3";
			params.push(model);
			if (promptTemplate !== undefined || temp !== 0.0) {
				sql += ", $4";
				params.push(k);
				if (promptTemplate !== undefined) {
					sql += ", $5";
					params.push(promptTemplate);
					if (temp !== 0.0) {
						sql += ", $6";
						params.push(temp);
					}
				} else if (temp !== 0.0) {
					sql += ", NULL, $5";
					params.push(temp);
				}
			} else {
				sql += ", $3";
				params.push(k);
			}
		} else {
			sql += ", NULL, $3";
			params.push(k);
			if (promptTemplate !== undefined) {
				sql += ", $4";
				params.push(promptTemplate);
				if (temp !== 0.0) {
					sql += ", $5";
					params.push(temp);
				}
			} else if (temp !== 0.0) {
				sql += ", NULL, $4";
				params.push(temp);
			}
		}
		
		sql += ")";
		
		const result = await this.db.query(sql, params);
		return result.rows;
	}

	/**
	 * Rerank using ColBERT (Contextualized Late Interaction over BERT)
	 * Late interaction model for fine-grained token-level reranking
	 */
	async rerankColbert(
		query: string,
		documents: string[],
		model?: string,
		topK?: number,
		nbits?: number,
		kmeansNiters?: number
	): Promise<any[]> {
		const modelName = model || "colbert-ir/colbertv2.0";
		const k = topK || documents.length;
		const bits = nbits !== undefined ? nbits : 2;
		const iters = kmeansNiters !== undefined ? kmeansNiters : 1;
		
		const result = await this.db.query(
			"SELECT * FROM neurondb.rerank_colbert($1, $2::text[], $3, $4, $5, $6)",
			[query, documents, modelName, k, bits, iters]
		);
		return result.rows;
	}

	/**
	 * Rerank using Reciprocal Rank Fusion (RRF)
	 * Combines multiple ranking lists using RRF algorithm
	 */
	async rerankRRF(
		rankingTables: string[],
		idColumn?: string,
		rankColumn?: string,
		k?: number
	): Promise<any[]> {
		const idCol = idColumn || "id";
		const rankCol = rankColumn || "rank";
		const kValue = k !== undefined ? k : 60;
		
		// Note: reciprocal_rank_fusion expects array of text[] (table names)
		const result = await this.db.query(
			"SELECT * FROM neurondb.reciprocal_rank_fusion($1::text[], $2, $3, $4)",
			[rankingTables, idCol, rankCol, kValue]
		);
		return result.rows;
	}

	/**
	 * Rerank using Weighted Ensemble
	 * Combines multiple ranking models using weighted sum
	 */
	async rerankEnsembleWeighted(
		modelTables: string[],
		weights?: number[],
		idColumn?: string,
		scoreColumn?: string,
		normalize?: boolean
	): Promise<any[]> {
		const idCol = idColumn || "id";
		const scoreCol = scoreColumn || "score";
		const norm = normalize !== undefined ? normalize : true;
		
		// Build query - weights can be NULL for equal weights
		let sql = "SELECT * FROM neurondb.rerank_ensemble_weighted($1::text[]";
		const params: any[] = [modelTables];
		
		if (weights && weights.length > 0) {
			sql += ", $2::real[]";
			params.push(weights);
			sql += ", $3, $4, $5";
			params.push(idCol, scoreCol, norm);
		} else {
			sql += ", NULL, $2, $3, $4";
			params.push(idCol, scoreCol, norm);
		}
		
		sql += ")";
		
		const result = await this.db.query(sql, params);
		return result.rows;
	}

	/**
	 * Rerank using Borda Count Ensemble
	 * Combines multiple ranking models using Borda count voting
	 */
	async rerankEnsembleBorda(
		modelTables: string[],
		idColumn?: string,
		scoreColumn?: string
	): Promise<any[]> {
		const idCol = idColumn || "id";
		const scoreCol = scoreColumn || "score";
		
		const result = await this.db.query(
			"SELECT * FROM neurondb.rerank_ensemble_borda($1::text[], $2, $3)",
			[modelTables, idCol, scoreCol]
		);
		return result.rows;
	}

	/**
	 * Get all reranking tool definitions for MCP
	 * Returns array of tool definitions compatible with MCP protocol
	 */
	getToolDefinitions(): ToolDefinition[] {
		return [
			{
				name: "mmr_rerank",
				description: "Rerank search results using Maximal Marginal Relevance (MMR) to balance relevance and diversity",
				inputSchema: {
					type: "object",
					properties: {
						table: { type: "string", description: "Table name containing documents" },
						queryVector: {
							type: "array",
							items: { type: "number" },
							description: "Query vector"
						},
						vectorColumn: { type: "string", description: "Column name containing vectors" },
						lambda: {
							type: "number",
							description: "Balance factor (0.0 = pure diversity, 1.0 = pure relevance)",
							default: 0.5
						},
						topK: {
							type: "number",
							description: "Number of results to return",
							default: 10
						}
					},
					required: ["table", "queryVector", "vectorColumn"]
				}
			},
			{
				name: "rerank_cross_encoder",
				description: "Rerank documents using cross-encoder neural model for fine-grained relevance scoring",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "User query string" },
						documents: {
							type: "array",
							items: { type: "string" },
							description: "Array of candidate document texts"
						},
						model: {
							type: "string",
							description: "Cross-encoder model name (default: ms-marco-MiniLM-L-6-v2)"
						},
						topK: {
							type: "number",
							description: "Number of top results to return",
							default: 10
						}
					},
					required: ["query", "documents"]
				}
			},
			{
				name: "rerank_llm",
				description: "Rerank documents using LLM completion API (GPT/Claude-powered) with full parameter support including custom prompts and temperature control",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "User query string" },
						documents: {
							type: "array",
							items: { type: "string" },
							description: "Array of candidate document texts"
						},
						model: {
							type: "string",
							description: "LLM model identifier (optional, uses GUC default if not provided)"
						},
						topK: {
							type: "number",
							description: "Number of top results to return",
							default: 10
						},
						promptTemplate: {
							type: "string",
							description: "Custom prompt template with {query} and {documents} placeholders (optional)"
						},
						temperature: {
							type: "number",
							description: "LLM temperature for generation (0.0-2.0, default: 0.0)",
							minimum: 0.0,
							maximum: 2.0
						}
					},
					required: ["query", "documents"]
				}
			},
			{
				name: "rerank_colbert",
				description: "Rerank documents using ColBERT (Contextualized Late Interaction over BERT) for token-level reranking",
				inputSchema: {
					type: "object",
					properties: {
						query: { type: "string", description: "User query string" },
						documents: {
							type: "array",
							items: { type: "string" },
							description: "Array of candidate document texts"
						},
						model: {
							type: "string",
							description: "ColBERT model identifier (default: colbert-ir/colbertv2.0)"
						},
						topK: {
							type: "number",
							description: "Number of top results to return",
							default: 10
						},
						nbits: {
							type: "number",
							description: "Number of bits for quantization (1-8, default: 2)",
							minimum: 1,
							maximum: 8
						},
						kmeansNiters: {
							type: "number",
							description: "K-means iterations for compression (default: 1)",
							minimum: 1,
							maximum: 100
						}
					},
					required: ["query", "documents"]
				}
			},
			{
				name: "rerank_rrf",
				description: "Combine multiple ranking lists using Reciprocal Rank Fusion (RRF) algorithm",
				inputSchema: {
					type: "object",
					properties: {
						rankingTables: {
							type: "array",
							items: { type: "string" },
							description: "Array of table names containing (id, rank) columns"
						},
						idColumn: {
							type: "string",
							description: "Column name for document IDs (default: id)"
						},
						rankColumn: {
							type: "string",
							description: "Column name for ranks (default: rank)"
						},
						k: {
							type: "number",
							description: "RRF constant (default: 60)",
							default: 60
						}
					},
					required: ["rankingTables"]
				}
			},
			{
				name: "rerank_ensemble_weighted",
				description: "Combine multiple ranking models using weighted sum ensemble",
				inputSchema: {
					type: "object",
					properties: {
						modelTables: {
							type: "array",
							items: { type: "string" },
							description: "Array of table names containing (id, score) columns"
						},
						weights: {
							type: "array",
							items: { type: "number" },
							description: "Weights for each model (optional, equal weights if not provided)"
						},
						idColumn: {
							type: "string",
							description: "Column name for document IDs (default: id)"
						},
						scoreColumn: {
							type: "string",
							description: "Column name for scores (default: score)"
						},
						normalize: {
							type: "boolean",
							description: "Apply min-max normalization (default: true)",
							default: true
						}
					},
					required: ["modelTables"]
				}
			},
			{
				name: "rerank_ensemble_borda",
				description: "Combine multiple ranking models using Borda count voting",
				inputSchema: {
					type: "object",
					properties: {
						modelTables: {
							type: "array",
							items: { type: "string" },
							description: "Array of table names containing (id, score) columns"
						},
						idColumn: {
							type: "string",
							description: "Column name for document IDs (default: id)"
						},
						scoreColumn: {
							type: "string",
							description: "Column name for scores (default: score)"
						}
					},
					required: ["modelTables"]
				}
			}
		];
	}

	/**
	 * Handle MCP tool call
	 * Routes tool calls to appropriate reranking method
	 * 
	 * This method handles parameter name mapping between MCP tool definitions
	 * (which use camelCase) and the internal method calls. It also provides
	 * default values and parameter validation.
	 */
	async handleToolCall(toolName: string, args: any): Promise<any> {
		switch (toolName) {
			case "mmr_rerank":
				// Map parameter names: MCP uses camelCase, handle both formats
				return await this.mmrRerank(
					args.table,
					args.queryVector || args.query_vector,
					args.vectorColumn || args.vector_column,
					args.lambda !== undefined ? args.lambda : 0.5,
					args.topK !== undefined ? args.topK : (args.top_k !== undefined ? args.top_k : 10)
				);

			case "rerank_cross_encoder":
				// Cross-encoder reranking with optional model and topK
				return await this.rerankCrossEncoder(
					args.query,
					args.documents,
					args.model,
					args.topK !== undefined ? args.topK : (args.top_k !== undefined ? args.top_k : undefined)
				);

			case "rerank_llm":
				// LLM reranking with FULL parameter support:
				// - query, documents (required)
				// - model (optional)
				// - topK (optional)
				// - promptTemplate (optional) - NEW!
				// - temperature (optional, 0.0-2.0) - NEW!
				return await this.rerankLLM(
					args.query,
					args.documents,
					args.model,
					args.topK !== undefined ? args.topK : (args.top_k !== undefined ? args.top_k : undefined),
					args.promptTemplate || args.prompt_template,  // Support both camelCase and snake_case
					args.temperature !== undefined ? args.temperature : undefined
				);

			case "rerank_colbert":
				// ColBERT reranking with quantization parameters
				return await this.rerankColbert(
					args.query,
					args.documents,
					args.model,
					args.topK !== undefined ? args.topK : (args.top_k !== undefined ? args.top_k : undefined),
					args.nbits !== undefined ? args.nbits : undefined,
					args.kmeansNiters !== undefined ? args.kmeansNiters : 
						(args.kmeans_niters !== undefined ? args.kmeans_niters : undefined)
				);

			case "rerank_rrf":
				// Reciprocal Rank Fusion for combining multiple rankings
				return await this.rerankRRF(
					args.rankingTables || args.ranking_tables,
					args.idColumn || args.id_column,
					args.rankColumn || args.rank_column,
					args.k !== undefined ? args.k : undefined
				);

			case "rerank_ensemble_weighted":
				// Weighted ensemble combining multiple ranking models
				return await this.rerankEnsembleWeighted(
					args.modelTables || args.model_tables,
					args.weights,
					args.idColumn || args.id_column,
					args.scoreColumn || args.score_column,
					args.normalize !== undefined ? args.normalize : undefined
				);

			case "rerank_ensemble_borda":
				// Borda count ensemble for combining rankings
				return await this.rerankEnsembleBorda(
					args.modelTables || args.model_tables,
					args.idColumn || args.id_column,
					args.scoreColumn || args.score_column
				);

			default:
				throw new Error(`Unknown reranking tool: ${toolName}. Available tools: mmr_rerank, rerank_cross_encoder, rerank_llm, rerank_colbert, rerank_rrf, rerank_ensemble_weighted, rerank_ensemble_borda`);
		}
	}
}
