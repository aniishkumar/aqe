import { useState, useCallback } from "react";
import { runQuery, getDataInfo } from "../api";

export function useQuery() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await runQuery(params);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, execute };
}

export function useDataInfo() {
  const [dataInfo, setDataInfo] = useState(null);

  const fetchInfo = useCallback(async () => {
    try {
      const info = await getDataInfo();
      setDataInfo(info);
    } catch {
      /* silent */
    }
  }, []);

  return { dataInfo, fetchInfo };
}
