import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Buildings, Plus } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import {
  Button,
  Input,
  Select,
  Spinner,
  DataError,
  EmptyState,
  Pagination,
} from '../../components/ui/index.js';
import { StatusBadge } from '../../components/property/StatusBadge.jsx';
import { formatMoney, formatDate } from '../../lib/format.js';

const STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'CHANGES_REQUESTED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
  'SOLD',
  'RENTED',
];

// Used by the agent portal (scope="mine") and the admin portal (no scope = all).
export function PropertiesListPage({ basePath, scope }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const status = params.get('status') || '';
  const setStatus = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('status', value);
    else next.delete('status');
    setParams(next, { replace: true });
  };
  const debounced = useDebouncedValue(search, 300);
  const showAgentColumn = scope !== 'mine';
  const { page, setPage } = usePageParam(`${debounced}|${status}|${scope || ''}`);

  const qs = new URLSearchParams({ pageSize: '20', page: String(page) });
  if (debounced) qs.set('search', debounced);
  if (status) qs.set('status', status);
  if (scope) qs.set('scope', scope);
  const { data, loading, error, refetch } = useApi(`/properties/manage?${qs.toString()}`);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Properties</h1>
        <Button as={Link} to={`${basePath}/properties/new`}>
          <Plus size={16} /> New property
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search title or reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="w-44"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ').toLowerCase()}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="py-10 text-center">
            <Spinner />
          </div>
        )}

        {!loading && error && <DataError message={error} onRetry={refetch} />}

        {!loading && !error && data?.data.length === 0 && (
          <EmptyState
            icon={Buildings}
            title="No properties here yet"
            action={
              <Button as={Link} to={`${basePath}/properties/new`}>
                Add the first one
              </Button>
            }
          >
            Create a property, add photos and a location, then have an administrator publish it.
          </EmptyState>
        )}

        {!loading && !error && data?.data.length > 0 && (
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink/[0.03] text-left text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  {showAgentColumn && <th className="px-3 py-2 font-medium">Agent</th>}
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((p) => (
                  <tr key={p.id} className="hover:bg-ink/[0.02]">
                    <td className="px-3 py-2 font-mono text-xs">
                      <Link
                        to={`${basePath}/properties/${p.id}`}
                        className="text-accent hover:underline"
                      >
                        {p.reference}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{p.title}</td>
                    <td className="px-3 py-2 text-ink-soft">{p.propertyType?.name}</td>
                    <td className="px-3 py-2 font-mono">
                      {formatMoney(p.price, p.currency, p.listingMode)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={p.status} />
                    </td>
                    {showAgentColumn && (
                      <td className="px-3 py-2 text-ink-soft">{p.agent || '-'}</td>
                    )}
                    <td className="px-3 py-2 text-ink-soft">{formatDate(p.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && data && (
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
