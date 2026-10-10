import pandas as pd
from pathlib import Path
from config import DATA_DIR, DEFAULT_DATASET_FILE, SAMPLE_ROW_COUNT
from data.generator import generate_sample_taxi_data

# Global cache so we don’t reload from disk on every query
_data_cache: dict[str, pd.DataFrame] = {}

def load_data(
    file_name: str = DEFAULT_DATASET_FILE,
    sample_size: int | None = None
) -> pd.DataFrame:
    """
    Loads dataset from /data directory. Auto-generates sample if absent.
    Caches loaded data in memory for fast analytical queries.
    """
    global _data_cache

    cache_key = f"{file_name}_{sample_size}"
    if cache_key in _data_cache:
        return _data_cache[cache_key]

    try:
        file_path = DATA_DIR / file_name

        if not file_path.exists():
            if file_name == DEFAULT_DATASET_FILE:
                generate_sample_taxi_data(file_path, num_rows=SAMPLE_ROW_COUNT)
            else:
                raise FileNotFoundError(f"Dataset not found: {file_path}")

        # Load depending on file type
        if file_path.suffix == ".csv":
            df = pd.read_csv(file_path, nrows=sample_size)
        elif file_path.suffix == ".parquet":
            df = pd.read_parquet(file_path)
            if sample_size:
                df = df.head(sample_size)
        else:
            raise ValueError(f"Unsupported file format: {file_path.suffix}")

        # Basic preprocessing
        df = df.dropna()

        # Cache in memory
        _data_cache[cache_key] = df
        print(f"[DATA] Loaded dataset '{file_name}' with {len(df):,} rows and {len(df.columns)} columns")
        return df

    except Exception as e:
        print(f"[ERROR] Error loading data: {e}")
        return None

def get_dataset_metadata(file_name: str = DEFAULT_DATASET_FILE) -> dict:
    df = load_data(file_name)
    if df is None:
        return {}
    
    col_info = []
    for idx, (col_name, dtype) in enumerate(df.dtypes.items(), start=1):
        col_info.append({
            "name": col_name,
            "type": str(dtype),
            "ordinal_position": idx,
            "is_nullable": bool(df[col_name].isnull().any()),
            "sample_distinct_count": int(df[col_name].nunique())
        })
        
    return {
        "dataset_name": "NYC Taxi Yellow Cab Trips",
        "file_name": file_name,
        "row_count": len(df),
        "columns": col_info
    }