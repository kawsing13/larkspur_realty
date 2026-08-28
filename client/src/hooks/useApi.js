// Small GET data-fetching hook. Returns { data, error, loading, refetch }, so the
// caller always has what it needs to render loading and error states, not just success.
//
//   const { data, loading, error, refetch } = useApi('/properties?pageSize=6');
//   const { data } = useApi(user ? '/favorites' : null);   // pass null / skip to hold off

import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../lib/apiClient.js';

export function useApi(path, { skip = false } = {}) {
  const active = !!path && !skip;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(active);

  const run = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(path);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [path, active]);

  useEffect(() => {
    run();
  }, [run]);

  return { data, error, loading, refetch: run };
}
