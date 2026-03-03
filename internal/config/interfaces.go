/*-------------------------------------------------------------------------
 *
 * interfaces.go
 *    Config provider interface for NeuronMCP
 *
 * Decouples components from concrete ConfigManager for testing.
 *
 * Copyright (c) 2024-2026, neurondb, Inc. <support@neurondb.ai>
 *
 * IDENTIFICATION
 *    NeuronMCP/internal/config/interfaces.go
 *
 *-------------------------------------------------------------------------
 */

package config

/* ConfigProvider supplies configuration; *ConfigManager implements this interface */
type ConfigProvider interface {
	GetDatabaseConfig() *DatabaseConfig
	GetServerSettings() *ServerSettings
	GetLoggingConfig() *LoggingConfig
	GetFeaturesConfig() *FeaturesConfig
	GetSafetyConfig() *SafetyConfig
}
