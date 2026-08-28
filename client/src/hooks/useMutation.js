// Small helper for write requests (POST / PATCH / PUT / DELETE) with loading and
// error state.
//
//   const save = useMutation((body) => api.patch(`/properties/${id}`, body));
//   const data = await save.run(values);   // returns response data, or throws
//   save.loading   save.error

import { useCallback, useState } from 'react';
import { errorMessage } from '../lib/apiClient.js';

export function useMutation(fn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fn(...args);
        return res?.data ?? res;
      } catch (err) {
        setError(errorMessage(err));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fn],
  );

  return { run, loading, error, clearError: () => setError(null) };
}
