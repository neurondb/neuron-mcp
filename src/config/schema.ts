/**
 * Configuration schema definitions for type-safe configuration
 */

export interface ServerConfig {
	database: DatabaseConfig;
	server: ServerSettings;
	logging: LoggingConfig;
	features: FeaturesConfig;
	plugins?: PluginConfig[];
	middleware?: MiddlewareConfig[];
}

export interface DatabaseConfig {
	connectionString?: string;
	host?: string;
	port?: number;
	database?: string;
	user?: string;
	password?: string;
	pool?: PoolConfig;
	ssl?: boolean | SSLConfig;
}

export interface PoolConfig {
	min?: number;
	max?: number;
	idleTimeoutMillis?: number;
	connectionTimeoutMillis?: number;
}

export interface SSLConfig {
	rejectUnauthorized?: boolean;
	ca?: string;
	cert?: string;
	key?: string;
}

export interface ServerSettings {
	name?: string;
	version?: string;
	timeout?: number;
	maxRequestSize?: number;
	enableMetrics?: boolean;
	enableHealthCheck?: boolean;
}

export interface LoggingConfig {
	level: "debug" | "info" | "warn" | "error";
	format: "json" | "text";
	output?: "stdout" | "stderr" | string;
	enableRequestLogging?: boolean;
	enableResponseLogging?: boolean;
	enableErrorStack?: boolean;
}

export interface FeaturesConfig {
	vector?: VectorFeatureConfig;
	ml?: MLFeatureConfig;
	analytics?: AnalyticsFeatureConfig;
	rag?: RAGFeatureConfig;
	projects?: ProjectsFeatureConfig;
	gpu?: GPUFeatureConfig;
	quantization?: QuantizationFeatureConfig;
	dimensionality?: DimensionalityFeatureConfig;
	reranking?: RerankingFeatureConfig;
	hybrid?: HybridFeatureConfig;
	workers?: WorkersFeatureConfig;
	indexing?: IndexingFeatureConfig;
}

export interface VectorFeatureConfig {
	enabled: boolean;
	defaultDistanceMetric?: "l2" | "cosine" | "inner_product" | "l1" | "hamming" | "chebyshev" | "minkowski";
	maxVectorDimension?: number;
	defaultLimit?: number;
}

export interface MLFeatureConfig {
	enabled: boolean;
	algorithms?: string[];
	maxTrainingTime?: number;
	gpuEnabled?: boolean;
}

export interface AnalyticsFeatureConfig {
	enabled: boolean;
	maxClusters?: number;
	maxIterations?: number;
}

export interface RAGFeatureConfig {
	enabled: boolean;
	defaultChunkSize?: number;
	defaultOverlap?: number;
}

export interface ProjectsFeatureConfig {
	enabled: boolean;
	maxProjects?: number;
}

export interface GPUFeatureConfig {
	enabled: boolean;
	deviceId?: number;
}

export interface QuantizationFeatureConfig {
	enabled: boolean;
	defaultMethod?: "fp8" | "fp16" | "int8" | "uint8" | "int4" | "binary" | "ternary";
}

export interface DimensionalityFeatureConfig {
	enabled: boolean;
	maxComponents?: number;
}

export interface RerankingFeatureConfig {
	enabled: boolean;
	defaultModel?: string;
}

export interface HybridFeatureConfig {
	enabled: boolean;
	defaultVectorWeight?: number;
}

export interface WorkersFeatureConfig {
	enabled: boolean;
	maxWorkers?: number;
}

export interface IndexingFeatureConfig {
	enabled: boolean;
	defaultHNSWM?: number;
	defaultHNSWEFConstruction?: number;
}

export interface PluginConfig {
	name: string;
	enabled: boolean;
	path?: string;
	config?: Record<string, any>;
}

export interface MiddlewareConfig {
	name: string;
	enabled: boolean;
	order?: number;
	config?: Record<string, any>;
}





