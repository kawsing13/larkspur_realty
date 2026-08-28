import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import { Input, Select, Spinner, DataError, EmptyState, Pagination } from '../../components/ui/index.js';
import { LeadStatusBadge } from '../../components/lead/LeadStatusBadge.jsx';
import { formatDate } from '../../lib/format.js';

const STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VIEWING_SCHEDULED',
  'NEGOTIATION',
  'WON',
  'LOST',
];

// Agent portal (scope="mine") and admin portal (all leads).
export function LeadsListPage({ basePath, scope }) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 300);
  const status = params.get('status') || '';
  const due = params.get('followUpDue') === 'true';
  const showAgent = scope !== 'mine';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const { page, setPage } = usePageParam(`${debounced}|${status}|${due}|${scope || ''}`);

  const qs = new URLSearchParams({ pageSize: '20', page: String(page) });
  if (debounced) qs.set('search', debounced);
  if (status) qs.set('status', status);
  if (due) qs.set('followUpDue', 'true');
  if (scope) qs.set('scope', scope);
  const { data, loading, error, refetch } = useApi(`/inquiries?${qs.toString()}`);

  return (
    <div>
      <h1 className="text-2xl">Leads</h1>
      <p className="mt-1 text-sm text-ink-soft">Inquiries from the marketplace. Open one to work it.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="w-48"
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
          aria-label="Status"
        >
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ').toLowerCase()}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-accent"
            checked={due}
            onChange={(e) => setParam('followUpDue', e.target.checked ? 'true' : '')}
          />
          Follow-up due
        </label>
      </div>

      <div className="mt-6">
        {loading && (
          <div className="py-10 text-center">
            <Spinner />
          </div>
        )}
        {!loading && error && <DataError message={error} onRetry={refetch} />}
        {!loading && !error && data?.data.length === 0 && (
          <EmptyState icon={Users} title="No leads match" />
        )}
        {!loading && !error && data?.data.length > 0 && (
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink/[0.03] text-left text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Property</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  {showAgent && <th className="px-3 py-2 font-medium">Agent</th>}
                  <th className="px-3 py-2 font-medium">Follow-up</th>
                  <th className="px-3 py-2 font-medium">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((i) => {
                  const overdue =
                    i.followUpDate &&
                    new Date(i.followUpDate) < new Date() &&
                    !['WON', 'LOST'].includes(i.status);
                  return (
                    <tr key={i.id} className="hover:bg-ink/[0.02]">
                      <td className="px-3 py-2">
                        <Link
                          to={`${basePath}/leads/${i.id}`}
                          className="text-accent hover:underline"
                        >
                          {i.name}
                        </Link>
                        <div className="text-xs text-ink-soft">{i.email}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{i.property?.reference || '-'}</td>
                      <td className="px-3 py-2">
                        <LeadStatusBadge status={i.status} />
                      </td>
                      {showAgent && (
                        <td className="px-3 py-2 text-ink-soft">
                          {i.assignedAgent || 'Unassigned'}
                        </td>
                      )}
                      <td className={`px-3 py-2 ${overdue ? 'text-danger' : 'text-ink-soft'}`}>
                        {i.followUpDate ? formatDate(i.followUpDate) : '-'}
                      </td>
                      <td className="px-3 py-2 text-ink-soft">{formatDate(i.createdAt)}</td>
                    </tr>
                  );
                })}
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
