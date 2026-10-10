const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getHome() {
  const res = await fetch(`${BASE_URL}/`);
  if (!res.ok) throw new Error("Engine offline");
  return res.json();
}

export async function getDataInfo() {
  const res = await fetch(`${BASE_URL}/data`);
  if (!res.ok) throw new Error("Failed to fetch data info");
  return res.json();
}

export async function getSample() {
  const res = await fetch(`${BASE_URL}/sample`);
  if (!res.ok) throw new Error("Failed to fetch sample data");
  return res.json();
}

export async function getDatasets() {
  const res = await fetch(`${BASE_URL}/datasets`);
  if (!res.ok) throw new Error("Failed to fetch datasets");
  return res.json();
}

export async function getDatasetColumns(datasetId = 1) {
  const res = await fetch(`${BASE_URL}/datasets/${datasetId}/columns`);
  if (!res.ok) throw new Error("Failed to fetch dataset columns");
  return res.json();
}

export async function runQuery(payload) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Query execution failed");
  }
  return res.json();
}

export async function getSketches(columnId = null) {
  const url = columnId ? `${BASE_URL}/sketches?column_id=${columnId}` : `${BASE_URL}/sketches`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch sketches");
  return res.json();
}

export async function getSketchRegisters(sketchId, limit = 1024, offset = 0) {
  const res = await fetch(`${BASE_URL}/sketches/${sketchId}/registers?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error("Failed to fetch sketch registers");
  return res.json();
}

export async function buildSketch(payload) {
  const res = await fetch(`${BASE_URL}/sketches/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Failed to build sketch");
  }
  return res.json();
}

export async function mergeSketches(targetSketchId, sourceSketchId) {
  const res = await fetch(`${BASE_URL}/sketches/merge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      target_sketch_id: targetSketchId,
      source_sketch_id: sourceSketchId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.detail || "Failed to merge sketches");
  }
  return res.json();
}

export async function getWorkloadAnalytics() {
  const res = await fetch(`${BASE_URL}/analytics/workload`);
  if (!res.ok) throw new Error("Failed to fetch workload analytics");
  return res.json();
}

export async function getAccuracyAnalytics() {
  const res = await fetch(`${BASE_URL}/analytics/accuracy`);
  if (!res.ok) throw new Error("Failed to fetch accuracy analytics");
  return res.json();
}

export async function getPrecisionSweep(column = "fare_amount") {
  const res = await fetch(`${BASE_URL}/analytics/precision-sweep?column=${encodeURIComponent(column)}`);
  if (!res.ok) throw new Error("Failed to fetch precision sweep");
  return res.json();
}

export async function getMergeLineage() {
  const res = await fetch(`${BASE_URL}/analytics/merges`);
  if (!res.ok) throw new Error("Failed to fetch merge lineage");
  return res.json();
}

export async function getQueryHistory() {
  const res = await fetch(`${BASE_URL}/history`);
  if (!res.ok) throw new Error("Failed to fetch query history");
  return res.json();
}

export async function getSchemaSummary() {
  const res = await fetch(`${BASE_URL}/schema-info`);
  if (!res.ok) throw new Error("Failed to fetch schema info");
  return res.json();
}
