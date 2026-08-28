import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// Keeps the current list page in the URL as ?page=N so it survives a refresh and
// the back button. Pass `filterKey` - a string built from the active filters
// (search text, status, ...). When it changes we jump back to page 1, so a
// narrower search never strands the user on a page that no longer exists.
export function usePageParam(filterKey = '') {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);

  const setPage = (next) => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next <= 1) p.delete('page');
        else p.set('page', String(next));
        return p;
      },
      { replace: true },
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Drop ?page= whenever the filters change - but not on the first render, so a
  // shared link like ...?status=NEW&page=3 still opens on page 3. We compare
  // against the previous filterKey rather than leaning on effect deps, so the
  // reset fires only on a real filter change and never on our own page writes.
  const prevFilterKey = useRef(filterKey);
  useEffect(() => {
    if (prevFilterKey.current === filterKey) return;
    prevFilterKey.current = filterKey;
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('page');
        return p;
      },
      { replace: true },
    );
  }, [filterKey, setParams]);

  return { page, setPage };
}
