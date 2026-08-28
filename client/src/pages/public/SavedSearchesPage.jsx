import { Link } from 'react-router-dom';
import { MagnifyingGlass, Trash } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/apiClient.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner, DataError, EmptyState, Button, Badge } from '../../components/ui/index.js';

// Turns stored criteria back into a /search URL.
const toSearchUrl = (criteria) => {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(criteria || {})) if (v) qs.set(k, v);
  return `/search?${qs.toString()}`;
};

const describe = (c) => {
  const parts = [];
  if (c.listingMode) parts.push(c.listingMode === 'RENT' ? 'For rent' : 'For sale');
  if (c.propertyType) parts.push(c.propertyType);
  if (c.city) parts.push(`in ${c.city}`);
  if (c.minBeds) parts.push(`${c.minBeds}+ beds`);
  if (c.maxPrice) parts.push(`under $${Number(c.maxPrice).toLocaleString()}`);
  if (c.q) parts.push(`"${c.q}"`);
  return parts.join(', ') || 'All listings';
};

export default function SavedSearchesPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useApi('/saved-searches');

  const remove = async (id) => {
    try {
      await api.delete(`/saved-searches/${id}`);
      toast.success('Saved search removed');
      refetch();
    } catch {
      toast.error('Could not remove that search');
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <h1 className="text-2xl">Saved searches</h1>
      <p className="mt-1 text-sm text-ink-soft">
        We notify you when a new listing matches one of these.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {loading && (
          <div className="py-6 text-center">
            <Spinner />
          </div>
        )}
        {!loading && error && <DataError message={error} onRetry={refetch} />}

        {!loading && !error && data?.data.length === 0 && (
          <EmptyState
            icon={MagnifyingGlass}
            title="No saved searches yet"
            action={
              <Button as={Link} to="/search">
                Start a search
              </Button>
            }
          >
            Run a search, then choose "Save this search" to be notified about new matches.
          </EmptyState>
        )}

        {!loading &&
          !error &&
          data?.data.map((s) => (
            <div key={s.id} className="rounded border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{s.name}</span>
                <div className="flex items-center gap-2">
                  {s.newSinceSaved > 0 && (
                    <Badge tone="accent">{s.newSinceSaved} new</Badge>
                  )}
                  <button
                    onClick={() => remove(s.id)}
                    aria-label="Remove"
                    className="text-ink-soft hover:text-danger"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-sm text-ink-soft">{describe(s.criteria)}</p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <Link to={toSearchUrl(s.criteria)} className="text-accent hover:underline">
                  View {s.currentMatches} {s.currentMatches === 1 ? 'match' : 'matches'}
                </Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
