# NeuronMCP Python Environment Setup

## Overview

This document describes how to set up a Python virtual environment for NeuronMCP with all required dependencies.

## Quick Start

```bash
cd NeuronMCP

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate  # On Windows

# Upgrade pip
pip install --upgrade pip setuptools wheel

# Install all dependencies
pip install -r requirements.txt

# Verify installation
python3 -c "import psycopg2, pandas, datasets; print('All core dependencies installed!')"
```

## Requirements File

The `requirements.txt` includes:

### Core Dependencies (Required)
- **psycopg2-binary**: PostgreSQL database adapter
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computing (dependency of pandas)

### Dataset Loading (Required)
- **datasets**: HuggingFace datasets library
- **huggingface-hub**: HuggingFace Hub client

### Optional Dependencies (Recommended)
- **boto3**: AWS S3 support for dataset loading
- **requests**: HTTP/URL support for dataset loading
- **pyarrow**: Parquet file format support

## Python Scripts in NeuronMCP

### Core Scripts (Require Dependencies)
1. **internal/tools/dataset_loader.py**
   - Requires: psycopg2-binary, pandas, datasets
   - Optional: boto3, requests, pyarrow

### Client Scripts (Standard Library Only)
- `client/mcp_client/*.py` - No external dependencies
- `client/neurondb_mcp_client.py` - No external dependencies

### Test/Verification Scripts (Standard Library Only)
- `test_all_tools.py`
- `test_comprehensive.py`
- `verify_integration.py`
- `verify_sql_integration.py`
- `verify_tool_count.py`
- `tests/*.py`

## Running NeuronMCP with Python Environment

### Option 1: Activate Environment Before Running

```bash
cd NeuronMCP
source .venv/bin/activate
./run_mcp_server.sh
```

### Option 2: Use Python from Virtual Environment

```bash
cd NeuronMCP
.venv/bin/python3 internal/tools/dataset_loader.py --help
```

### Option 3: Set PYTHON Environment Variable

```bash
cd NeuronMCP
export PYTHON=.venv/bin/python3
./run_mcp_server.sh
```

## Verification

Test that dataset loading works:

```bash
cd NeuronMCP
source .venv/bin/activate

# Test dataset loader script directly
python3 internal/tools/dataset_loader.py \
  --source-type huggingface \
  --source-path "squad" \
  --split "train" \
  --limit 10 \
  --no-auto-embed \
  --no-create-indexes
```

## Troubleshooting

### Issue: ModuleNotFoundError

**Solution**: Ensure virtual environment is activated:
```bash
source .venv/bin/activate
```

### Issue: psycopg2 installation fails

**Solution**: Use psycopg2-binary (pre-compiled):
```bash
pip install psycopg2-binary
```

### Issue: datasets library not found

**Solution**: Install datasets library:
```bash
pip install datasets huggingface-hub
```

### Issue: Permission denied

**Solution**: Ensure script is executable:
```bash
chmod +x internal/tools/dataset_loader.py
```

### Issue: Embeddings Returning Zeros

**Root Cause**: The embedding API key is not configured in PostgreSQL.

**Solution**: Set the API key in PostgreSQL:

```sql
-- For Hugging Face API
ALTER SYSTEM SET neurondb.llm_api_key = 'hf_your_token_here';
SELECT pg_reload_conf();

-- Verify
SELECT current_setting('neurondb.llm_api_key', true);

-- Test embedding
SELECT embed_text('test text')::text;
```

**For SQL-based testing**, see [test_embeddings.sql](../../examples/data_loading/test_embeddings.sql)

## Updating Dependencies

```bash
cd NeuronMCP
source .venv/bin/activate
pip install --upgrade -r requirements.txt
```

## Deactivating Environment

```bash
deactivate
```


