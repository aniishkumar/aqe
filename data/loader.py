import pandas as pd
from pathlib import Path

# Global cache (so we don’t reload every time)
_data_cache = None


def load_data(
    file_name: str = "yellow_tripdata_2015-01.csv",
    sample_size: int | None = 1048576
):
    """
    Loads NYC Taxi dataset.

    Args:
        file_name (str): Name of the dataset file inside /data folder
        sample_size (int | None): Number of rows to load (None = full dataset)

    Returns:
        pd.DataFrame
    """

    global _data_cache

    # Return cached data if already loaded
    if _data_cache is not None:
        return _data_cache

    try:
        # Build file path safely
        base_path = Path(__file__).resolve().parent
        file_path = base_path / file_name

        # Load depending on file type
        if file_path.suffix == ".csv":
            df = pd.read_csv(file_path, nrows=sample_size)

        elif file_path.suffix == ".parquet":
            df = pd.read_parquet(file_path)
            if sample_size:
                df = df.head(sample_size)

        else:
            raise ValueError("Unsupported file format")

        # Basic preprocessing
        df = df.dropna()

        # Cache it
        _data_cache = df

        print(f"[WORKING] Loaded dataset with {len(df)} rows")

        return df

    except Exception as e:
        print(f"[ERROR] Error loading data: {e}")
        return None