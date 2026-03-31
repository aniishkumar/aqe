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
  if (!res.ok) throw new Error("Failed to fetch sample");
  return res.json();
}

export async function runQuery({ query_type, column, sample_rate, group_by }) {
  const res = await fetch(`${BASE_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query_type,
      column,
      sample_rate,
      group_by: group_by || null,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.detail?.[0]?.msg || "Query failed");
  }
  return res.json();
}
