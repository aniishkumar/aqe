from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from engine.benchmark import run_benchmark
from data.loader import load_data

# 🚀 Create FastAPI app
app = FastAPI()

# 🌐 Enable CORS (for frontend later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📊 Load dataset once at startup
df = load_data()


# 🧾 Request schema
class QueryRequest(BaseModel):
    query_type: str
    column: str
    sample_rate: float = 0.1
    group_by: str | None = None


#  Home route
@app.get("/")
def home():
    return {"message": "AQP Engine API Running 🚀"}


#  Dataset info (VERY IMPORTANT for testing)
@app.get("/data")
def get_data_info():
    if df is None:
        return {"error": "Data not loaded"}

    return {
        "rows": len(df),
        "columns": list(df.columns)
    }


#  Sample data preview
@app.get("/sample")
def get_sample():
    if df is None:
        return {"error": "Data not loaded"}

    return df.head(5).to_dict(orient="records")


#  Main query endpoint
@app.post("/query")
def run_query(req: QueryRequest):
    if df is None:
        return {"error": "Data not loaded"}

    try:
        result = run_benchmark(
            df,
            req.query_type,
            column=req.column,
            group_by=req.group_by,
            sample_rate=req.sample_rate
        )
        return result

    except Exception as e:
        return {"error": str(e)}