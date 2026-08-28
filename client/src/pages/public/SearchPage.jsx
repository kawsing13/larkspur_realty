import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { House, BookmarkSimple } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { SearchFilters } from '../../components/property/SearchFilters.jsx';
import { PropertyCard } from '../../components/property/PropertyCard.jsx';
import { PropertyCardSkeleton } from '../../components/property/PropertyCardSkeleton.jsx';
import { EmptyState, DataError, Pagination, Input, Button } from '../../components/ui/index.js';

const PAGE_SIZE = 12;
const CRITERIA_KEYS = [
  'q',
  'listingMode',
  'propertyType',
  'city',
  'minPrice',
  'maxPrice',
  'minBeds',
  'minBaths',
  'amenities',
  'sort',
];

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const { hasRole } = useAuth();
  const toast = useToast();
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };
  const resetFilters = () => setParams(new URLSearchParams(), { replace: true });
  const goToPage = (p) => {
    setParam('page', String(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const apiQs = new URLSearchParams();
  for (const [k, v] of params.entries()) if (v) apiQs.set(k, v);
  apiQs.set('pageSize', String(PAGE_SIZE));

  const results = useApi(`/search?${apiQs.toString()}`);
  const types = useApi('/property-types');
  const amenities = useApi('/amenities');
  const facets = useApi('/search/facets');
  const data = results.data;

  const saveSearch = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      const criteria = {};
      for (const k of CRITERIA_KEYS) {
        const v = params.get(k);
        if (v) criteria[k] = v;
      }
      await api.post('/saved-searches', { name: saveName.trim(), criteria });
      toast.success('Search saved. We will let you know about new matches.');
      setSaveOpen(false);
      setSaveName('');
    } catch {
      toast.error('Could not save that search');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <h1 className="text-2xl">Listings</h1>

      <div className="mt-4">
        <SearchFilters
          params={params}
          setParam={setParam}
          onReset={resetFilters}
          types={types.data?.data || []}
          amenities={amenities.data?.data || []}
          facets={facets.data}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {data ? `${data.total} ${data.total === 1 ? 'result' : 'results'}` : ' '}
        </p>
        {hasRole('CUSTOMER') && !saveOpen && (
          <button
            onClick={() => setSaveOpen(true)}
            className="flex items-center gap-1.5 text-sm text-accent hover:underline"
          >
            <BookmarkSimple size={14} /> Save this search
          </button>
        )}
        {hasRole('CUSTOMER') && saveOpen && (
          <div className="flex items-center gap-2">
            <Input
              className="h-9 w-56"
              placeholder="Name this search"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              autoFocus
            />
            <Button className="h-9 px-3" loading={saving} disabled={!saveName.trim()} onClick={saveSearch}>
              Save
            </Button>
            <button
              onClick={() => setSaveOpen(false)}
              className="text-sm text-ink-soft hover:text-ink"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.loading &&
          Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}

        {!results.loading && results.error && (
          <div className="sm:col-span-2 lg:col-span-3">
            <DataError message={results.error} onRetry={results.refetch} />
          </div>
        )}

        {!results.loading && !results.error && data?.data.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState icon={House} title="Nothing matches those filters">
              Widen the price range or clear a filter to see more.
            </EmptyState>
          </div>
        )}

        {!results.loading &&
          !results.error &&
          data?.data.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={goToPage} />}
    </div>
  );
}
