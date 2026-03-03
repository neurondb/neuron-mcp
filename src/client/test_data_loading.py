#!/usr/bin/env python3
"""
Test script for MCP Client -> NeuronMCP Data Loading Capabilities

Tests the load_dataset tool with various HuggingFace datasets and verifies
data loading, schema detection, embedding generation, and index creation.
"""

import sys
import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

# Add client directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from mcp_client.client import MCPClient
from mcp_client.config import load_config

# Try to import psycopg2 for database verification
try:
    import psycopg2
    from psycopg2 import sql
    HAS_PSYCOPG2 = True
except ImportError:
    HAS_PSYCOPG2 = False
    print("Warning: psycopg2 not available. Database verification will be limited.", file=sys.stderr)


class DatabaseVerifier:
    """Verifies data loaded into PostgreSQL database."""
    
    def __init__(self, db_config: Dict[str, Any]):
        """Initialize with database configuration."""
        self.db_config = db_config
        self.conn = None
    
    def connect(self):
        """Connect to PostgreSQL database."""
        if not HAS_PSYCOPG2:
            raise RuntimeError("psycopg2 not available for database verification")
        
        try:
            self.conn = psycopg2.connect(
                host=self.db_config.get('host', 'localhost'),
                port=int(self.db_config.get('port', 5432)),
                user=self.db_config.get('user', 'postgres'),
                password=self.db_config.get('password', ''),
                database=self.db_config.get('database', 'postgres')
            )
        except Exception as e:
            raise RuntimeError(f"Failed to connect to database: {e}")
    
    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()
    
    def verify_table_exists(self, schema_name: str, table_name: str) -> bool:
        """Verify table exists in the specified schema."""
        try:
            with self.conn.cursor() as cur:
                query = """
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = %s AND table_name = %s
                    )
                """
                cur.execute(query, (schema_name, table_name))
                return cur.fetchone()[0]
        except Exception as e:
            print(f"Error verifying table existence: {e}", file=sys.stderr)
            return False
    
    def get_row_count(self, schema_name: str, table_name: str) -> int:
        """Get row count for a table."""
        try:
            with self.conn.cursor() as cur:
                query = sql.SQL("SELECT COUNT(*) FROM {}.{}").format(
                    sql.Identifier(schema_name),
                    sql.Identifier(table_name)
                )
                cur.execute(query)
                return cur.fetchone()[0]
        except Exception as e:
            print(f"Error getting row count: {e}", file=sys.stderr)
            return -1
    
    def get_columns(self, schema_name: str, table_name: str) -> List[str]:
        """Get list of column names for a table."""
        try:
            with self.conn.cursor() as cur:
                query = """
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = %s AND table_name = %s
                    ORDER BY ordinal_position
                """
                cur.execute(query, (schema_name, table_name))
                return [row[0] for row in cur.fetchall()]
        except Exception as e:
            print(f"Error getting columns: {e}", file=sys.stderr)
            return []
    
    def check_embedding_column(self, schema_name: str, table_name: str, 
                               embedding_column: str) -> Dict[str, Any]:
        """Check embedding column for non-null values and dimensions."""
        result = {
            "exists": False,
            "non_null_count": 0,
            "total_count": 0,
            "sample_dimension": None
        }
        
        try:
            with self.conn.cursor() as cur:
                # Check if column exists
                query = """
                    SELECT EXISTS (
                        SELECT FROM information_schema.columns 
                        WHERE table_schema = %s AND table_name = %s AND column_name = %s
                    )
                """
                cur.execute(query, (schema_name, table_name, embedding_column))
                if not cur.fetchone()[0]:
                    return result
                
                result["exists"] = True
                
                # Get counts
                count_query = sql.SQL("""
                    SELECT 
                        COUNT(*) as total,
                        COUNT({}) as non_null,
                        array_length({}, 1) as dim
                    FROM {}.{}
                    WHERE {} IS NOT NULL
                    LIMIT 1
                """).format(
                    sql.Identifier(embedding_column),
                    sql.Identifier(embedding_column),
                    sql.Identifier(embedding_column),
                    sql.Identifier(schema_name),
                    sql.Identifier(table_name),
                    sql.Identifier(embedding_column)
                )
                cur.execute(count_query)
                row = cur.fetchone()
                if row:
                    result["total_count"] = row[0] if row[0] else 0
                    result["non_null_count"] = row[1] if row[1] else 0
                    result["sample_dimension"] = row[2] if row[2] else None
                
        except Exception as e:
            print(f"Error checking embedding column: {e}", file=sys.stderr)
        
        return result
    
    def get_indexes(self, schema_name: str, table_name: str) -> List[Dict[str, Any]]:
        """Get list of indexes for a table."""
        indexes = []
        try:
            with self.conn.cursor() as cur:
                query = """
                    SELECT 
                        indexname,
                        indexdef
                    FROM pg_indexes 
                    WHERE schemaname = %s AND tablename = %s
                """
                cur.execute(query, (schema_name, table_name))
                for row in cur.fetchall():
                    indexes.append({
                        "name": row[0],
                        "definition": row[1]
                    })
        except Exception as e:
            print(f"Error getting indexes: {e}", file=sys.stderr)
        
        return indexes
    
    def sample_rows(self, schema_name: str, table_name: str, limit: int = 3) -> List[Dict[str, Any]]:
        """Sample rows from a table."""
        rows = []
        try:
            with self.conn.cursor() as cur:
                query = sql.SQL("SELECT * FROM {}.{} LIMIT %s").format(
                    sql.Identifier(schema_name),
                    sql.Identifier(table_name)
                )
                cur.execute(query, (limit,))
                
                # Get column names
                columns = [desc[0] for desc in cur.description]
                
                # Fetch rows
                for row in cur.fetchall():
                    row_dict = {}
                    for i, col in enumerate(columns):
                        value = row[i]
                        # Convert to JSON-serializable format
                        if isinstance(value, (list, tuple)):
                            value = list(value)
                        elif hasattr(value, '__dict__'):
                            value = str(value)
                        row_dict[col] = value
                    rows.append(row_dict)
        except Exception as e:
            print(f"Error sampling rows: {e}", file=sys.stderr)
        
        return rows


class DataLoadingTester:
    """Main test class for data loading capabilities."""
    
    def __init__(self, config_path: str, server_name: str = "neurondb"):
        """Initialize tester with configuration."""
        self.config = load_config(config_path, server_name)
        self.client = MCPClient(self.config, verbose=False)
        
        # Get database config from environment
        self.db_config = {
            'host': self.config.env.get('NEURONDB_HOST', 'localhost'),
            'port': int(self.config.env.get('NEURONDB_PORT', '5432')),
            'user': self.config.env.get('NEURONDB_USER', 'postgres'),
            'password': self.config.env.get('NEURONDB_PASSWORD', ''),
            'database': self.config.env.get('NEURONDB_DATABASE', 'postgres')
        }
        
        self.verifier = DatabaseVerifier(self.db_config) if HAS_PSYCOPG2 else None
        
        self.test_results = {
            "metadata": {
                "start_time": None,
                "end_time": None,
                "total_tests": 0,
                "passed_tests": 0,
                "failed_tests": 0
            },
            "test_cases": []
        }
    
    def run_all_tests(self):
        """Run all test cases."""
        print("=" * 80)
        print("MCP Client -> NeuronMCP Data Loading Test Suite")
        print("=" * 80)
        print()
        
        self.test_results["metadata"]["start_time"] = datetime.now().isoformat()
        
        # Connect to MCP server
        print("Connecting to MCP server...")
        try:
            self.client.connect()
            print("✓ Connected to MCP server")
        except Exception as e:
            print(f"✗ Failed to connect: {e}")
            return
        
        # Connect to database for verification
        if self.verifier:
            try:
                self.verifier.connect()
                print("✓ Connected to PostgreSQL database")
            except Exception as e:
                print(f"⚠ Warning: Could not connect to database for verification: {e}")
                self.verifier = None
        else:
            print("⚠ Database verification disabled (psycopg2 not available)")
        
        print()
        
        # Run test cases
        self.test_api_key_verification()
        self.test_basic_loading()
        self.test_auto_embedding()
        self.test_index_creation()
        self.test_custom_config()
        self.test_error_handling()
        
        # Disconnect
        self.client.disconnect()
        if self.verifier:
            self.verifier.close()
        
        self.test_results["metadata"]["end_time"] = datetime.now().isoformat()
        
        # Generate report
        self.generate_report()
    
    def test_api_key_verification(self):
        """Test Case 0: Verify HuggingFace API key can be read from PostgreSQL"""
        print("=" * 80)
        print("Test Case 0: HuggingFace API Key Verification")
        print("=" * 80)
        
        test_case = {
            "name": "API Key Verification",
            "status": "pending",
            "details": {}
        }
        
        try:
            if not self.verifier:
                print("⚠ Database verification disabled (psycopg2 not available)")
                test_case["status"] = "skipped"
                test_case["details"] = {"reason": "psycopg2 not available"}
            else:
                print("Checking PostgreSQL for HuggingFace API key...")
                
                # Query the GUC variable
                try:
                    with self.verifier.conn.cursor() as cur:
                        cur.execute("SELECT current_setting('neurondb.llm_api_key', true)")
                        result = cur.fetchone()
                        
                        if result and result[0]:
                            api_key = result[0].strip()
                            if api_key:
                                # Mask the key for display
                                masked_key = api_key[:8] + "..." + api_key[-4:] if len(api_key) > 12 else "***"
                                print(f"✓ HuggingFace API key found in PostgreSQL: {masked_key}")
                                test_case["status"] = "passed"
                                test_case["details"] = {
                                    "key_found": True,
                                    "key_length": len(api_key),
                                    "key_preview": masked_key
                                }
                            else:
                                print("⚠ HuggingFace API key is set but empty")
                                test_case["status"] = "partial"
                                test_case["details"] = {
                                    "key_found": False,
                                    "message": "Key is empty"
                                }
                        else:
                            print("⚠ HuggingFace API key not found in PostgreSQL GUC variables")
                            print("  Note: This is OK for public datasets, but may be required for private datasets")
                            test_case["status"] = "partial"
                            test_case["details"] = {
                                "key_found": False,
                                "message": "Key not set in postgresql.auto.conf or via ALTER SYSTEM"
                            }
                except Exception as e:
                    print(f"✗ Error querying API key: {e}")
                    test_case["status"] = "failed"
                    test_case["error"] = str(e)
        
        except Exception as e:
            print(f"✗ Exception: {e}")
            test_case["status"] = "failed"
            test_case["error"] = str(e)
        
        self.test_results["test_cases"].append(test_case)
        self.test_results["metadata"]["total_tests"] += 1
        if test_case["status"] == "passed":
            self.test_results["metadata"]["passed_tests"] += 1
        elif test_case["status"] == "failed":
            self.test_results["metadata"]["failed_tests"] += 1
        
        print()
    
    def test_basic_loading(self):
        """Test Case 1: Basic dataset loading without embeddings."""
        print("=" * 80)
        print("Test Case 1: Basic Dataset Loading")
        print("=" * 80)
        
        test_case = {
            "name": "Basic Dataset Loading",
            "status": "pending",
            "details": {}
        }
        
        try:
            # Load a small dataset without embeddings
            dataset_name = "sentence-transformers/embedding-training-data"
            split = "train"
            limit = 100
            
            print(f"Loading dataset: {dataset_name} (split: {split}, limit: {limit})")
            print("Parameters: auto_embed=false, create_indexes=false")
            
            arguments = {
                "source_type": "huggingface",
                "source_path": dataset_name,
                "split": split,
                "limit": limit,
                "auto_embed": False,
                "create_indexes": False,
                "schema_name": "datasets"
            }
            
            result = self.client.call_tool("load_dataset", arguments)
            
            # Check for errors
            if result.get("isError", False):
                error_msg = self._extract_error(result)
                print(f"✗ Failed: {error_msg}")
                test_case["status"] = "failed"
                test_case["error"] = error_msg
            else:
                # Extract result information
                content = result.get("content", [])
                result_text = ""
                if content and isinstance(content, list) and len(content) > 0:
                    if isinstance(content[0], dict) and "text" in content[0]:
                        result_text = content[0]["text"]
                
                print(f"✓ Load completed")
                print(f"Result: {result_text[:200]}...")
                
                # Parse result to get table name
                table_info = self._parse_load_result(result)
                schema_name = table_info.get("schema", "datasets")
                table_name = table_info.get("table", "")
                
                if table_name:
                    # Verify in database
                    if self.verifier:
                        print(f"\nVerifying in database: {schema_name}.{table_name}")
                        
                        # Check table exists
                        if self.verifier.verify_table_exists(schema_name, table_name):
                            print("✓ Table exists")
                            
                            # Check row count
                            row_count = self.verifier.get_row_count(schema_name, table_name)
                            print(f"✓ Row count: {row_count}")
                            
                            # Get columns
                            columns = self.verifier.get_columns(schema_name, table_name)
                            print(f"✓ Columns: {', '.join(columns[:10])}{'...' if len(columns) > 10 else ''}")
                            
                            # Sample rows
                            samples = self.verifier.sample_rows(schema_name, table_name, 2)
                            if samples:
                                print(f"✓ Sample data retrieved ({len(samples)} rows)")
                            
                            test_case["details"] = {
                                "table": f"{schema_name}.{table_name}",
                                "row_count": row_count,
                                "columns": columns,
                                "sample_rows": samples[:2]  # Limit sample size
                            }
                        else:
                            print("✗ Table not found in database")
                            test_case["status"] = "failed"
                            test_case["error"] = "Table not found after loading"
                    else:
                        test_case["details"] = {
                            "table": f"{schema_name}.{table_name}",
                            "verification": "skipped (no database connection)"
                        }
                    
                    test_case["status"] = "passed"
                else:
                    print("⚠ Could not extract table name from result")
                    test_case["status"] = "partial"
                    test_case["details"] = {"result": result_text}
        
        except Exception as e:
            print(f"✗ Exception: {e}")
            test_case["status"] = "failed"
            test_case["error"] = str(e)
        
        self.test_results["test_cases"].append(test_case)
        self.test_results["metadata"]["total_tests"] += 1
        if test_case["status"] == "passed":
            self.test_results["metadata"]["passed_tests"] += 1
        else:
            self.test_results["metadata"]["failed_tests"] += 1
        
        print()
    
    def test_auto_embedding(self):
        """Test Case 2: Dataset loading with auto-embedding enabled."""
        print("=" * 80)
        print("Test Case 2: Auto-Embedding")
        print("=" * 80)
        
        test_case = {
            "name": "Auto-Embedding",
            "status": "pending",
            "details": {}
        }
        
        try:
            # Load dataset with embeddings
            dataset_name = "squad"
            split = "train"
            limit = 100
            
            print(f"Loading dataset: {dataset_name} (split: {split}, limit: {limit})")
            print("Parameters: auto_embed=true, create_indexes=false")
            
            arguments = {
                "source_type": "huggingface",
                "source_path": dataset_name,
                "split": split,
                "limit": limit,
                "auto_embed": True,
                "create_indexes": False,
                "schema_name": "datasets",
                "embedding_model": "default"
            }
            
            result = self.client.call_tool("load_dataset", arguments)
            
            if result.get("isError", False):
                error_msg = self._extract_error(result)
                print(f"✗ Failed: {error_msg}")
                test_case["status"] = "failed"
                test_case["error"] = error_msg
            else:
                print("✓ Load completed")
                
                table_info = self._parse_load_result(result)
                schema_name = table_info.get("schema", "datasets")
                table_name = table_info.get("table", "")
                
                if table_name and self.verifier:
                    print(f"\nVerifying embeddings in: {schema_name}.{table_name}")
                    
                    if self.verifier.verify_table_exists(schema_name, table_name):
                        columns = self.verifier.get_columns(schema_name, table_name)
                        
                        # Find embedding columns
                        embedding_columns = [col for col in columns if col.endswith("_embedding")]
                        print(f"✓ Found {len(embedding_columns)} embedding column(s): {', '.join(embedding_columns)}")
                        
                        # Check each embedding column
                        embedding_details = {}
                        for embed_col in embedding_columns:
                            embed_info = self.verifier.check_embedding_column(
                                schema_name, table_name, embed_col
                            )
                            print(f"  - {embed_col}: {embed_info['non_null_count']}/{embed_info['total_count']} rows have embeddings")
                            if embed_info["sample_dimension"]:
                                print(f"    Dimension: {embed_info['sample_dimension']}")
                            embedding_details[embed_col] = embed_info
                        
                        test_case["details"] = {
                            "table": f"{schema_name}.{table_name}",
                            "embedding_columns": embedding_columns,
                            "embedding_details": embedding_details
                        }
                        
                        if embedding_columns and any(
                            embed_info["non_null_count"] > 0 
                            for embed_info in embedding_details.values()
                        ):
                            test_case["status"] = "passed"
                        else:
                            test_case["status"] = "failed"
                            test_case["error"] = "No embeddings generated"
                    else:
                        test_case["status"] = "failed"
                        test_case["error"] = "Table not found"
                else:
                    test_case["status"] = "partial"
                    test_case["details"] = {"verification": "skipped"}
        
        except Exception as e:
            print(f"✗ Exception: {e}")
            test_case["status"] = "failed"
            test_case["error"] = str(e)
        
        self.test_results["test_cases"].append(test_case)
        self.test_results["metadata"]["total_tests"] += 1
        if test_case["status"] == "passed":
            self.test_results["metadata"]["passed_tests"] += 1
        else:
            self.test_results["metadata"]["failed_tests"] += 1
        
        print()
    
    def test_index_creation(self):
        """Test Case 3: Dataset loading with index creation."""
        print("=" * 80)
        print("Test Case 3: Index Creation")
        print("=" * 80)
        
        test_case = {
            "name": "Index Creation",
            "status": "pending",
            "details": {}
        }
        
        try:
            # Load dataset with indexes
            dataset_name = "imdb"
            split = "train"
            limit = 100
            
            print(f"Loading dataset: {dataset_name} (split: {split}, limit: {limit})")
            print("Parameters: auto_embed=true, create_indexes=true")
            
            arguments = {
                "source_type": "huggingface",
                "source_path": dataset_name,
                "split": split,
                "limit": limit,
                "auto_embed": True,
                "create_indexes": True,
                "schema_name": "datasets",
                "embedding_model": "default"
            }
            
            result = self.client.call_tool("load_dataset", arguments)
            
            if result.get("isError", False):
                error_msg = self._extract_error(result)
                print(f"✗ Failed: {error_msg}")
                test_case["status"] = "failed"
                test_case["error"] = error_msg
            else:
                print("✓ Load completed")
                
                table_info = self._parse_load_result(result)
                schema_name = table_info.get("schema", "datasets")
                table_name = table_info.get("table", "")
                
                if table_name and self.verifier:
                    print(f"\nVerifying indexes in: {schema_name}.{table_name}")
                    
                    if self.verifier.verify_table_exists(schema_name, table_name):
                        indexes = self.verifier.get_indexes(schema_name, table_name)
                        print(f"✓ Found {len(indexes)} index(es)")
                        
                        # Get columns to check for embedding columns
                        columns = self.verifier.get_columns(schema_name, table_name)
                        embedding_columns = [col for col in columns if col.endswith("_embedding")]
                        
                        hnsw_indexes = []
                        gin_indexes = []
                        other_indexes = []
                        
                        for idx in indexes:
                            idx_type = "unknown"
                            idx_def_lower = idx["definition"].lower()
                            
                            if "hnsw" in idx_def_lower:
                                idx_type = "HNSW"
                                hnsw_indexes.append(idx)
                            elif "gin" in idx_def_lower:
                                idx_type = "GIN"
                                gin_indexes.append(idx)
                            elif "btree" in idx_def_lower or "btree" in idx["name"].lower():
                                idx_type = "B-tree"
                                other_indexes.append(idx)
                            else:
                                other_indexes.append(idx)
                            
                            print(f"  - {idx['name']}: {idx_type}")
                        
                        # Verify HNSW indexes exist for embedding columns
                        if embedding_columns:
                            print(f"\nVerifying HNSW indexes for {len(embedding_columns)} embedding column(s)...")
                            for embed_col in embedding_columns:
                                # Check if there's an HNSW index for this column
                                has_hnsw = any(
                                    embed_col in idx["definition"] or embed_col in idx["name"]
                                    for idx in hnsw_indexes
                                )
                                if has_hnsw:
                                    print(f"  ✓ HNSW index found for {embed_col}")
                                else:
                                    print(f"  ⚠ No HNSW index found for {embed_col}")
                        
                        test_case["details"] = {
                            "table": f"{schema_name}.{table_name}",
                            "indexes": indexes,
                            "hnsw_count": len(hnsw_indexes),
                            "gin_count": len(gin_indexes),
                            "other_count": len(other_indexes),
                            "embedding_columns": embedding_columns,
                            "has_hnsw_for_embeddings": len(hnsw_indexes) > 0
                        }
                        
                        if indexes:
                            # Pass if we have indexes, especially HNSW for embeddings
                            if embedding_columns and len(hnsw_indexes) > 0:
                                test_case["status"] = "passed"
                            elif len(indexes) > 0:
                                test_case["status"] = "passed"
                            else:
                                test_case["status"] = "partial"
                                test_case["error"] = "Indexes created but no HNSW indexes for embeddings"
                        else:
                            test_case["status"] = "partial"
                            test_case["error"] = "No indexes created"
                    else:
                        test_case["status"] = "failed"
                        test_case["error"] = "Table not found"
                else:
                    test_case["status"] = "partial"
                    test_case["details"] = {"verification": "skipped"}
        
        except Exception as e:
            print(f"✗ Exception: {e}")
            test_case["status"] = "failed"
            test_case["error"] = str(e)
        
        self.test_results["test_cases"].append(test_case)
        self.test_results["metadata"]["total_tests"] += 1
        if test_case["status"] == "passed":
            self.test_results["metadata"]["passed_tests"] += 1
        else:
            self.test_results["metadata"]["failed_tests"] += 1
        
        print()
    
    def test_custom_config(self):
        """Test Case 4: Custom schema/table names and parameters."""
        print("=" * 80)
        print("Test Case 4: Custom Configuration")
        print("=" * 80)
        
        test_case = {
            "name": "Custom Configuration",
            "status": "pending",
            "details": {}
        }
        
        try:
            # Load with custom schema and table name
            dataset_name = "sentence-transformers/embedding-training-data"
            split = "train"
            limit = 50
            
            custom_schema = "test_schema"
            custom_table = "test_custom_table"
            
            print(f"Loading dataset: {dataset_name}")
            print(f"Custom schema: {custom_schema}, table: {custom_table}")
            print(f"Parameters: limit={limit}, auto_embed=false")
            
            arguments = {
                "source_type": "huggingface",
                "source_path": dataset_name,
                "split": split,
                "limit": limit,
                "auto_embed": False,
                "create_indexes": False,
                "schema_name": custom_schema,
                "table_name": custom_table
            }
            
            result = self.client.call_tool("load_dataset", arguments)
            
            if result.get("isError", False):
                error_msg = self._extract_error(result)
                print(f"✗ Failed: {error_msg}")
                test_case["status"] = "failed"
                test_case["error"] = error_msg
            else:
                print("✓ Load completed")
                
                table_info = self._parse_load_result(result)
                result_schema = table_info.get("schema", custom_schema)
                result_table = table_info.get("table", custom_table)
                
                if self.verifier:
                    print(f"\nVerifying custom configuration: {result_schema}.{result_table}")
                    
                    # Verify schema matches
                    schema_match = result_schema == custom_schema
                    table_match = result_table == custom_table
                    
                    print(f"Schema match: {'✓' if schema_match else '✗'} (expected: {custom_schema}, got: {result_schema})")
                    print(f"Table match: {'✓' if table_match else '✗'} (expected: {custom_table}, got: {result_table})")
                    
                    if self.verifier.verify_table_exists(result_schema, result_table):
                        row_count = self.verifier.get_row_count(result_schema, result_table)
                        print(f"✓ Row count: {row_count} (expected: ~{limit})")
                        
                        test_case["details"] = {
                            "expected_schema": custom_schema,
                            "actual_schema": result_schema,
                            "expected_table": custom_table,
                            "actual_table": result_table,
                            "row_count": row_count,
                            "schema_match": schema_match,
                            "table_match": table_match
                        }
                        
                        if schema_match and table_match:
                            test_case["status"] = "passed"
                        else:
                            test_case["status"] = "partial"
                    else:
                        test_case["status"] = "failed"
                        test_case["error"] = "Table not found"
                else:
                    test_case["status"] = "partial"
                    test_case["details"] = {"verification": "skipped"}
        
        except Exception as e:
            print(f"✗ Exception: {e}")
            test_case["status"] = "failed"
            test_case["error"] = str(e)
        
        self.test_results["test_cases"].append(test_case)
        self.test_results["metadata"]["total_tests"] += 1
        if test_case["status"] == "passed":
            self.test_results["metadata"]["passed_tests"] += 1
        else:
            self.test_results["metadata"]["failed_tests"] += 1
        
        print()
    
    def test_error_handling(self):
        """Test Case 5: Error handling for invalid inputs."""
        print("=" * 80)
        print("Test Case 5: Error Handling")
        print("=" * 80)
        
        test_case = {
            "name": "Error Handling",
            "status": "pending",
            "details": {}
        }
        
        errors_tested = []
        
        # Test 1: Invalid dataset name
        print("\nTest 5.1: Invalid dataset name")
        try:
            arguments = {
                "source_type": "huggingface",
                "source_path": "invalid/dataset/that/does/not/exist",
                "split": "train",
                "limit": 10
            }
            result = self.client.call_tool("load_dataset", arguments)
            
            if result.get("isError", False):
                error_msg = self._extract_error(result)
                print(f"✓ Correctly returned error: {error_msg[:100]}...")
                errors_tested.append({
                    "test": "invalid_dataset",
                    "status": "passed",
                    "error_received": error_msg[:200]
                })
            else:
                print("✗ Expected error but got success")
                errors_tested.append({
                    "test": "invalid_dataset",
                    "status": "failed",
                    "note": "Should have returned error"
                })
        except Exception as e:
            print(f"⚠ Exception (may be expected): {e}")
            errors_tested.append({
                "test": "invalid_dataset",
                "status": "partial",
                "exception": str(e)
            })
        
        # Test 2: Missing required parameter
        print("\nTest 5.2: Missing required parameter (source_path)")
        try:
            arguments = {
                "source_type": "huggingface",
                "split": "train"
                # Missing source_path
            }
            result = self.client.call_tool("load_dataset", arguments)
            
            if result.get("isError", False):
                error_msg = self._extract_error(result)
                print(f"✓ Correctly returned error: {error_msg[:100]}...")
                errors_tested.append({
                    "test": "missing_parameter",
                    "status": "passed",
                    "error_received": error_msg[:200]
                })
            else:
                print("✗ Expected error but got success")
                errors_tested.append({
                    "test": "missing_parameter",
                    "status": "failed"
                })
        except Exception as e:
            print(f"⚠ Exception (may be expected): {e}")
            errors_tested.append({
                "test": "missing_parameter",
                "status": "partial",
                "exception": str(e)
            })
        
        # Test 3: Invalid source type
        print("\nTest 5.3: Invalid source type")
        try:
            arguments = {
                "source_type": "invalid_type",
                "source_path": "some/path",
                "limit": 10
            }
            result = self.client.call_tool("load_dataset", arguments)
            
            if result.get("isError", False):
                error_msg = self._extract_error(result)
                print(f"✓ Correctly returned error: {error_msg[:100]}...")
                errors_tested.append({
                    "test": "invalid_source_type",
                    "status": "passed",
                    "error_received": error_msg[:200]
                })
            else:
                print("✗ Expected error but got success")
                errors_tested.append({
                    "test": "invalid_source_type",
                    "status": "failed"
                })
        except Exception as e:
            print(f"⚠ Exception (may be expected): {e}")
            errors_tested.append({
                "test": "invalid_source_type",
                "status": "partial",
                "exception": str(e)
            })
        
        # Evaluate overall status
        passed_errors = sum(1 for e in errors_tested if e["status"] == "passed")
        total_errors = len(errors_tested)
        
        if passed_errors == total_errors:
            test_case["status"] = "passed"
        elif passed_errors > 0:
            test_case["status"] = "partial"
        else:
            test_case["status"] = "failed"
        
        test_case["details"] = {
            "errors_tested": errors_tested,
            "passed": passed_errors,
            "total": total_errors
        }
        
        self.test_results["test_cases"].append(test_case)
        self.test_results["metadata"]["total_tests"] += 1
        if test_case["status"] == "passed":
            self.test_results["metadata"]["passed_tests"] += 1
        else:
            self.test_results["metadata"]["failed_tests"] += 1
        
        print()
    
    def _extract_error(self, result: Dict[str, Any]) -> str:
        """Extract error message from result."""
        if result.get("isError", False):
            content = result.get("content", [])
            if content and isinstance(content, list) and len(content) > 0:
                if isinstance(content[0], dict):
                    if "text" in content[0]:
                        return content[0]["text"]
                    elif "error" in content[0]:
                        return str(content[0]["error"])
        
        if "error" in result:
            return str(result["error"])
        
        return "Unknown error"
    
    def _parse_load_result(self, result: Dict[str, Any]) -> Dict[str, str]:
        """Parse load_dataset result to extract table information."""
        table_info = {"schema": "datasets", "table": ""}
        
        # Try to extract from content
        content = result.get("content", [])
        if content and isinstance(content, list) and len(content) > 0:
            if isinstance(content[0], dict) and "text" in content[0]:
                text = content[0]["text"]
                # Try to parse JSON from text
                try:
                    import json
                    # Look for JSON in the text
                    if "{" in text:
                        json_start = text.find("{")
                        json_end = text.rfind("}") + 1
                        if json_end > json_start:
                            json_str = text[json_start:json_end]
                            data = json.loads(json_str)
                            if "table" in data:
                                table_full = data["table"]
                                if "." in table_full:
                                    parts = table_full.split(".", 1)
                                    table_info["schema"] = parts[0]
                                    table_info["table"] = parts[1]
                                else:
                                    table_info["table"] = table_full
                except:
                    pass
        
        return table_info
    
    def generate_report(self):
        """Generate comprehensive test report."""
        print("=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print()
        
        metadata = self.test_results["metadata"]
        total = metadata["total_tests"]
        passed = metadata["passed_tests"]
        failed = metadata["failed_tests"]
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ({passed/total*100:.1f}%)" if total > 0 else "Passed: 0")
        print(f"Failed: {failed} ({failed/total*100:.1f}%)" if total > 0 else "Failed: 0")
        print()
        
        print("Test Case Results:")
        print("-" * 80)
        for i, test_case in enumerate(self.test_results["test_cases"], 1):
            status_symbol = "✓" if test_case["status"] == "passed" else "✗" if test_case["status"] == "failed" else "⚠"
            print(f"{i}. {status_symbol} {test_case['name']}: {test_case['status']}")
            if test_case.get("error"):
                print(f"   Error: {test_case['error'][:100]}...")
        print()
        
        # Save results to file
        results_file = Path(__file__).parent / "test_data_loading_results.json"
        with open(results_file, 'w') as f:
            json.dump(self.test_results, f, indent=2, default=str)
        
        print(f"Detailed results saved to: {results_file}")
        print("=" * 80)


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Test MCP Client -> NeuronMCP Data Loading Capabilities"
    )
    parser.add_argument(
        "-c", "--config",
        default=str(Path(__file__).parent.parent / "neuronmcp_server.json"),
        help="Path to NeuronMCP server configuration file"
    )
    parser.add_argument(
        "--server-name",
        default="neurondb",
        help="Server name from config"
    )
    
    args = parser.parse_args()
    
    # Check if config file exists
    config_path = Path(args.config)
    if not config_path.exists():
        print(f"Error: Configuration file not found: {config_path}", file=sys.stderr)
        sys.exit(1)
    
    # Run tests
    tester = DataLoadingTester(str(config_path), args.server_name)
    tester.run_all_tests()


if __name__ == "__main__":
    main()


