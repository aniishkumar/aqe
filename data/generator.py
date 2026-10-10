import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

def generate_sample_taxi_data(output_path: Path, num_rows: int = 100_000, seed: int = 42) -> pd.DataFrame:
    """
    Generates a realistic NYC Taxi Trip dataset for AQE benchmarking.
    Saves to CSV at output_path if it doesn't already exist.
    """
    if output_path.exists():
        print(f"[DATA] Sample dataset already exists at {output_path}")
        return pd.read_csv(output_path)

    print(f"[DATA] Generating {num_rows:,} synthetic NYC Taxi trip records at {output_path}...")
    np.random.seed(seed)

    vendor_ids = np.random.choice([1, 2], size=num_rows, p=[0.45, 0.55])
    passenger_counts = np.random.choice([1, 2, 3, 4, 5, 6], size=num_rows, p=[0.70, 0.15, 0.05, 0.03, 0.05, 0.02])
    rate_codes = np.random.choice([1, 2, 3, 4, 5], size=num_rows, p=[0.95, 0.02, 0.01, 0.01, 0.01])
    payment_types = np.random.choice([1, 2, 3, 4], size=num_rows, p=[0.65, 0.30, 0.03, 0.02])

    # Log-normal distribution for trip distance (in miles)
    trip_distances = np.round(np.random.lognormal(mean=0.8, sigma=0.75, size=num_rows), 2)
    trip_distances = np.clip(trip_distances, 0.1, 85.0)

    # Base fare calculation + noise
    fare_amounts = np.round(2.5 + trip_distances * 2.5 + np.random.exponential(scale=1.5, size=num_rows), 2)
    fare_amounts = np.clip(fare_amounts, 2.5, 350.0)

    extras = np.random.choice([0.0, 0.5, 1.0], size=num_rows, p=[0.6, 0.3, 0.1])
    mta_taxes = np.full(num_rows, 0.5)

    # Tips (credit card payers tip, cash payers often 0 in record)
    tip_amounts = np.where(
        payment_types == 1,
        np.round(fare_amounts * np.random.uniform(0.10, 0.25, size=num_rows), 2),
        0.0
    )
    tolls_amounts = np.where(trip_distances > 10.0, np.round(np.random.choice([0.0, 5.76, 6.55], size=num_rows), 2), 0.0)
    total_amounts = np.round(fare_amounts + extras + mta_taxes + tip_amounts + tolls_amounts, 2)

    # Pickups in NYC geo range
    pickup_longitudes = np.round(-73.985 + np.random.normal(0, 0.03, size=num_rows), 6)
    pickup_latitudes = np.round(40.748 + np.random.normal(0, 0.03, size=num_rows), 6)

    # Generate dates around January 2015
    base_time = datetime(2015, 1, 15, 0, 0, 0)
    minute_offsets = np.random.randint(0, 14 * 24 * 60, size=num_rows)
    duration_minutes = np.clip(np.random.exponential(scale=12, size=num_rows), 1, 180).astype(int)

    pickup_datetimes = [base_time + timedelta(minutes=int(m)) for m in minute_offsets]
    dropoff_datetimes = [p + timedelta(minutes=int(d)) for p, d in zip(pickup_datetimes, duration_minutes)]

    df = pd.DataFrame({
        "vendor_id": vendor_ids,
        "pickup_datetime": [dt.strftime("%Y-%m-%d %H:%M:%S") for dt in pickup_datetimes],
        "dropoff_datetime": [dt.strftime("%Y-%m-%d %H:%M:%S") for dt in dropoff_datetimes],
        "passenger_count": passenger_counts,
        "trip_distance": trip_distances,
        "pickup_longitude": pickup_longitudes,
        "pickup_latitude": pickup_latitudes,
        "rate_code": rate_codes,
        "payment_type": payment_types,
        "fare_amount": fare_amounts,
        "extra": extras,
        "mta_tax": mta_taxes,
        "tip_amount": tip_amounts,
        "tolls_amount": tolls_amounts,
        "total_amount": total_amounts
    })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"[DATA] Saved {len(df):,} records to {output_path}")
    return df

if __name__ == "__main__":
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from config import DATA_DIR, DEFAULT_DATASET_FILE, SAMPLE_ROW_COUNT
    target = DATA_DIR / DEFAULT_DATASET_FILE
    generate_sample_taxi_data(target, num_rows=SAMPLE_ROW_COUNT)

