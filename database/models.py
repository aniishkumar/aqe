from datetime import datetime
from sqlalchemy import (
    Column as SAColumn,
    Integer,
    BigInteger,
    SmallInteger,
    String,
    Text,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    CheckConstraint
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

def PK_ID():
    """Returns BigInteger for PostgreSQL while falling back to Integer for SQLite auto-increment."""
    return SAColumn(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)

class User(Base):
    __tablename__ = "users"

    user_id = PK_ID()
    full_name = SAColumn(String(120), nullable=False)

    email = SAColumn(String(255), unique=True, nullable=False)
    role = SAColumn(String(20), nullable=False)
    created_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("role IN ('ADMIN', 'ANALYST', 'DEVELOPER')", name="chk_user_role"),
    )

    query_requests = relationship("QueryRequest", back_populates="user")


class Dataset(Base):
    __tablename__ = "datasets"

    dataset_id = PK_ID()
    dataset_name = SAColumn(String(200), unique=True, nullable=False)
    source_uri = SAColumn(Text, nullable=False)
    format = SAColumn(String(30), nullable=False)
    row_count = SAColumn(BigInteger, nullable=True)
    status = SAColumn(String(20), nullable=False)
    created_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("format IN ('CSV', 'PARQUET', 'JSON', 'DATABASE', 'OTHER')", name="chk_dataset_format"),
        CheckConstraint("row_count IS NULL OR row_count >= 0", name="chk_dataset_row_count"),
        CheckConstraint("status IN ('ACTIVE', 'ARCHIVED', 'PROCESSING')", name="chk_dataset_status"),
    )

    columns = relationship("ColumnModel", back_populates="dataset", cascade="all, delete-orphan")


class ColumnModel(Base):
    __tablename__ = "columns"

    column_id = PK_ID()
    dataset_id = SAColumn(BigInteger, ForeignKey("datasets.dataset_id", ondelete="CASCADE"), nullable=False)
    column_name = SAColumn(String(200), nullable=False)
    data_type = SAColumn(String(60), nullable=False)
    ordinal_position = SAColumn(Integer, nullable=False)
    is_nullable = SAColumn(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint("dataset_id", "column_name", name="uq_dataset_column"),
        CheckConstraint("ordinal_position > 0", name="chk_ordinal_position"),
    )

    dataset = relationship("Dataset", back_populates="columns")
    query_requests = relationship("QueryRequest", back_populates="target_column")
    sketches = relationship("HLLSketch", back_populates="column")


class QueryRequest(Base):
    __tablename__ = "query_requests"

    query_id = PK_ID()
    user_id = SAColumn(BigInteger, ForeignKey("users.user_id"), nullable=False)
    target_column_id = SAColumn(BigInteger, ForeignKey("columns.column_id"), nullable=False)
    operation = SAColumn(String(30), nullable=False)
    query_text = SAColumn(Text, nullable=True)
    precision_p = SAColumn(SmallInteger, nullable=False)
    register_count = SAColumn(Integer, nullable=False)
    status = SAColumn(String(20), nullable=False)
    created_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("precision_p > 0", name="chk_precision_p"),
        CheckConstraint("register_count > 0", name="chk_register_count"),
        CheckConstraint("status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')", name="chk_query_status"),
    )

    user = relationship("User", back_populates="query_requests")
    target_column = relationship("ColumnModel", back_populates="query_requests")
    filters = relationship("QueryFilter", back_populates="query", cascade="all, delete-orphan")
    groupings = relationship("QueryGrouping", back_populates="query", cascade="all, delete-orphan")
    result = relationship("QueryResult", back_populates="query", uselist=False, cascade="all, delete-orphan")
    metrics = relationship("ExecutionMetric", back_populates="query", cascade="all, delete-orphan")


class QueryFilter(Base):
    __tablename__ = "query_filters"

    filter_id = PK_ID()
    query_id = SAColumn(BigInteger, ForeignKey("query_requests.query_id", ondelete="CASCADE"), nullable=False)
    column_id = SAColumn(BigInteger, ForeignKey("columns.column_id"), nullable=False)
    operator = SAColumn(String(20), nullable=False)
    value_text = SAColumn(Text, nullable=False)
    position = SAColumn(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint("operator IN ('=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IN')", name="chk_filter_operator"),
        CheckConstraint("position > 0", name="chk_filter_position"),
    )

    query = relationship("QueryRequest", back_populates="filters")
    column = relationship("ColumnModel")


class QueryGrouping(Base):
    __tablename__ = "query_groupings"

    grouping_id = PK_ID()
    query_id = SAColumn(BigInteger, ForeignKey("query_requests.query_id", ondelete="CASCADE"), nullable=False)
    column_id = SAColumn(BigInteger, ForeignKey("columns.column_id"), nullable=False)
    position = SAColumn(Integer, nullable=False)

    __table_args__ = (
        UniqueConstraint("query_id", "column_id", name="uq_query_grouping"),
        CheckConstraint("position > 0", name="chk_grouping_position"),
    )

    query = relationship("QueryRequest", back_populates="groupings")
    column = relationship("ColumnModel")


class HLLSketch(Base):
    __tablename__ = "hll_sketches"

    sketch_id = PK_ID()
    column_id = SAColumn(BigInteger, ForeignKey("columns.column_id"), nullable=False)
    precision_p = SAColumn(SmallInteger, nullable=False)
    register_count = SAColumn(Integer, nullable=False)
    algorithm_version = SAColumn(String(40), nullable=False)
    hash_version = SAColumn(String(40), nullable=False)
    representation = SAColumn(String(20), nullable=False)
    build_timestamp = SAColumn(DateTime, default=datetime.utcnow, nullable=False)
    is_current = SAColumn(Boolean, default=True, nullable=False)

    __table_args__ = (
        CheckConstraint("precision_p > 0", name="chk_sketch_precision_p"),
        CheckConstraint("register_count > 0", name="chk_sketch_register_count"),
        CheckConstraint("representation IN ('SPARSE', 'DENSE')", name="chk_sketch_representation"),
    )

    column = relationship("ColumnModel", back_populates="sketches")
    registers = relationship("HLLRegister", back_populates="sketch", cascade="all, delete-orphan")
    results = relationship("QueryResult", back_populates="sketch")


class HLLRegister(Base):
    __tablename__ = "hll_registers"

    sketch_id = SAColumn(BigInteger, ForeignKey("hll_sketches.sketch_id", ondelete="CASCADE"), primary_key=True)
    register_index = SAColumn(Integer, primary_key=True)
    register_value = SAColumn(SmallInteger, nullable=False)

    __table_args__ = (
        CheckConstraint("register_index >= 0", name="chk_register_index"),
        CheckConstraint("register_value >= 0", name="chk_register_value"),
    )

    sketch = relationship("HLLSketch", back_populates="registers")


class SketchMerge(Base):
    __tablename__ = "sketch_merges"

    merge_id = PK_ID()
    target_sketch_id = SAColumn(BigInteger, ForeignKey("hll_sketches.sketch_id", ondelete="CASCADE"), nullable=False)
    source_sketch_id = SAColumn(BigInteger, ForeignKey("hll_sketches.sketch_id", ondelete="CASCADE"), nullable=False)
    merged_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)

    target_sketch = relationship("HLLSketch", foreign_keys=[target_sketch_id])
    source_sketch = relationship("HLLSketch", foreign_keys=[source_sketch_id])


class QueryResult(Base):
    __tablename__ = "query_results"

    result_id = PK_ID()
    query_id = SAColumn(BigInteger, ForeignKey("query_requests.query_id", ondelete="CASCADE"), unique=True, nullable=False)
    sketch_id = SAColumn(BigInteger, ForeignKey("hll_sketches.sketch_id"), nullable=True)
    estimated_cardinality = SAColumn(Numeric(30, 6), nullable=False)
    relative_error_target = SAColumn(Numeric(10, 8), nullable=True)
    exact_cardinality = SAColumn(Numeric(30, 6), nullable=True)
    error_percent = SAColumn(Numeric(12, 6), nullable=True)
    generated_at = SAColumn(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("estimated_cardinality >= 0", name="chk_estimated_cardinality"),
        CheckConstraint("relative_error_target IS NULL OR relative_error_target >= 0", name="chk_relative_error_target"),
        CheckConstraint("exact_cardinality IS NULL OR exact_cardinality >= 0", name="chk_exact_cardinality"),
        CheckConstraint("error_percent IS NULL OR error_percent >= 0", name="chk_error_percent"),
    )

    query = relationship("QueryRequest", back_populates="result")
    sketch = relationship("HLLSketch", back_populates="results")


class ExecutionMetric(Base):
    __tablename__ = "execution_metrics"

    execution_id = PK_ID()
    query_id = SAColumn(BigInteger, ForeignKey("query_requests.query_id", ondelete="CASCADE"), nullable=False)
    start_time = SAColumn(DateTime, nullable=False)
    end_time = SAColumn(DateTime, nullable=False)
    latency_ms = SAColumn(Numeric(14, 3), nullable=False)
    rows_processed = SAColumn(BigInteger, nullable=True)
    memory_bytes = SAColumn(BigInteger, nullable=True)
    merge_count = SAColumn(Integer, default=0, nullable=False)
    exact_comparison_run = SAColumn(Boolean, default=False, nullable=False)

    __table_args__ = (
        CheckConstraint("latency_ms >= 0", name="chk_latency_ms"),
        CheckConstraint("rows_processed IS NULL OR rows_processed >= 0", name="chk_rows_processed"),
        CheckConstraint("memory_bytes IS NULL OR memory_bytes >= 0", name="chk_memory_bytes"),
        CheckConstraint("merge_count >= 0", name="chk_merge_count"),
    )

    query = relationship("QueryRequest", back_populates="metrics")
