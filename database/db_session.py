import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, Session
from config import DATABASE_URL, SQLITE_URL

from database.models import (
    Base, User, Dataset, ColumnModel, HLLSketch, HLLRegister
)

# Engine initialization with fallback logic
def create_aqe_engine():
    target_url = DATABASE_URL
    try:
        # Test connection to configured DATABASE_URL (e.g. PostgreSQL)
        test_engine = create_engine(target_url, pool_pre_ping=True)
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"[DB] Successfully connected to configured database: {target_url.split('@')[-1] if '@' in target_url else target_url}")
        return test_engine
    except Exception as e:
        print(f"[DB] Warning: Could not connect to {target_url} ({e}).")
        print(f"[DB] Falling back to local SQLite engine: {SQLITE_URL}")
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

engine = create_aqe_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db(force: bool = False):
    """
    Creates tables and seeds master metadata (users, datasets, columns) if not present.
    """
    # Create all tables defined in Base metadata
    Base.metadata.create_all(bind=engine)
    
    with SessionLocal() as db:
        # 1. Seed Users if table is empty
        if db.query(User).count() == 0:
            print("[DB] Seeding default users (Admin, Analyst, Developer)...")
            users = [
                User(user_id=1, full_name="System Administrator", email="admin@aqe.lab", role="ADMIN"),
                User(user_id=2, full_name="Data Analyst", email="analyst@aqe.lab", role="ANALYST"),
                User(user_id=3, full_name="Engine Developer", email="dev@aqe.lab", role="DEVELOPER"),
            ]
            db.add_all(users)
            db.commit()

        # 2. Seed Default Dataset & Columns if empty
        if db.query(Dataset).count() == 0:
            print("[DB] Seeding default dataset and schema columns...")
            from data.loader import get_dataset_metadata
            meta = get_dataset_metadata()

            if meta:
                dataset = Dataset(
                    dataset_id=1,
                    dataset_name=meta.get("dataset_name", "NYC Taxi Yellow Cab Trips"),
                    source_uri=f"data/{meta.get('file_name', 'yellow_tripdata_sample.csv')}",
                    format="CSV",
                    row_count=meta.get("row_count", 100000),
                    status="ACTIVE"
                )
                db.add(dataset)
                db.commit()

                # Add columns
                columns_to_add = []
                for col in meta.get("columns", []):
                    columns_to_add.append(
                        ColumnModel(
                            column_id=col["ordinal_position"],
                            dataset_id=1,
                            column_name=col["name"],
                            data_type=col["type"],
                            ordinal_position=col["ordinal_position"],
                            is_nullable=col["is_nullable"]
                        )
                    )
                db.add_all(columns_to_add)
                db.commit()
                print(f"[DB] Registered {len(columns_to_add)} columns for dataset '{dataset.dataset_name}'.")

        # Create indexes if they don't already exist (especially on SQLite/PostgreSQL)
        try:
            with engine.connect() as conn:
                index_sqls = [
                    "CREATE INDEX IF NOT EXISTS idx_columns_dataset_name ON columns(dataset_id, column_name);",
                    "CREATE INDEX IF NOT EXISTS idx_queries_target ON query_requests(target_column_id);",
                    "CREATE INDEX IF NOT EXISTS idx_queries_created ON query_requests(created_at);",
                    "CREATE INDEX IF NOT EXISTS idx_filters_query ON query_filters(query_id, position);",
                    "CREATE INDEX IF NOT EXISTS idx_groupings_query ON query_groupings(query_id, position);",
                    "CREATE INDEX IF NOT EXISTS idx_sketch_column_current ON hll_sketches(column_id, is_current);",
                    "CREATE INDEX IF NOT EXISTS idx_results_query ON query_results(query_id);",
                    "CREATE INDEX IF NOT EXISTS idx_metrics_query ON execution_metrics(query_id, start_time);"
                ]
                for sql in index_sqls:
                    conn.execute(text(sql))
                conn.commit()
        except Exception as idx_err:
            print(f"[DB] Index creation note: {idx_err}")

    print("[DB] Database initialization completed successfully.")

if __name__ == "__main__":
    init_db()
