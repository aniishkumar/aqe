import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

# Database Configuration
# Defaults to PostgreSQL, with transparent fallback to SQLite for local development/testing
POSTGRES_URL = os.getenv("AQE_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/aqe_db")
SQLITE_URL = f"sqlite:///{BASE_DIR / 'aqe.db'}"

# Active database URL: uses environment variable or checks if PostgreSQL is specified
DATABASE_URL = os.getenv("DATABASE_URL", POSTGRES_URL)

# HyperLogLog Defaults (from Heule et al., 2013)
DEFAULT_PRECISION_P = 10  # m = 2^10 = 1024 registers
MIN_PRECISION_P = 4       # m = 16
MAX_PRECISION_P = 18      # m = 262,144
ALGORITHM_VERSION = "HLL-Heule2013-v1.0"
HASH_VERSION = "Murmur64A-v1"

# Dataset Defaults
DEFAULT_DATASET_FILE = "yellow_tripdata_sample.csv"
SAMPLE_ROW_COUNT = 100_000
