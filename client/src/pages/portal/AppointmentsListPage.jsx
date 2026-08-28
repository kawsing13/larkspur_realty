import { Link, useSearchParams } from 'react-router-dom';
import { CalendarBlank } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import { Select, Spinner, DataError, EmptyState, Pagination } from '../../components/ui/index.js';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge.jsx';
import { formatTime, dayKey, dayLabel } from '../../lib/format.js';

const STATUSES = ['REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];

// Agent portal (scope="mine") and admin portal (all).
export function AppointmentsListPage({ basePath, scope }) {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  // Default to "upcoming" unless the caller arrived with a status filter.
  const view = params.get('view') || (status ? 'all' : 'upcoming');

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const { page, setPage } = usePageParam(`${status}|${view}|${scope || ''}`);

  const qs = new URLSearchParams({ pageSize: '25', page: String(page) });
  if (status) qs.set('status', status);
  if (view === 'upcoming') qs.set('upcoming', 'true');
  if (scope) qs.set('scope', scope);
  const { data, loading, error, refetch } = useApi(`/appointments?${qs.toString()}`);

  // Group by day.
  const groups = [];
  for (const a of data?.data || []) {
    const key = dayKey(a.effectiveStart);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: dayLabel(a.effectiveStart), items: [] };
      groups.push(group);
    }
    group.items.push(a);
  }

  return (
    <div>
      <h1 className="text-2xl">Viewings</h1>
      <p className="mt-1 text-sm text-ink-soft">Property viewings you are hosting.</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <Select
          className="w-40"
          value={view}
          onChange={(e) => setParam('view', e.target.value)}
          aria-label="View"
        >
          <option value="upcoming">Upcoming</option>
          <option value="all">All</option>
        </Select>
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
      </div>

      <div className="mt-6">
        {loading && (
          <div className="py-10 text-center">
            <Spinner />
          </div>
        )}
        {!loading && error && <DataError message={error} onRetry={refetch} />}
        {!loading && !error && groups.length === 0 && (
          <EmptyState icon={CalendarBlank} title="No viewings to show" />
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.key}>
                <h2 className="text-sm font-medium text-ink-soft">{group.label}</h2>
                <ul className="mt-2 divide-y divide-line rounded border border-line">
                  {group.items.map((a) => (
                    <li key={a.id}>
                      <Link
                        to={`${basePath}/appointments/${a.id}`}
                        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm hover:bg-ink/[0.02]"
                      >
                        <span className="font-mono">{formatTime(a.effectiveStart)}</span>
                        <span className="font-medium">{a.contactName}</span>
                        <span className="text-ink-soft">{a.property?.reference}</span>
                        {scope !== 'mine' && a.agent && (
                          <span className="text-ink-soft">{a.agent}</span>
                        )}
                        <span className="ml-auto">
                          <AppointmentStatusBadge status={a.status} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && data && (
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
