import { useEffect, useState } from 'react';

// Delays a changing value (e.g. a search box) so downstream effects do not fire
// on every keystroke.
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
