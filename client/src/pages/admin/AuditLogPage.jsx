import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import { Select, Spinner, DataError, Pagination } from '../../components/ui/index.js';
import { formatDateTime } from '../../lib/format.js';

const ENTITY_TYPES = ['Listing', 'Property', 'PropertyDocument', 'Inquiry', 'Appointment', 'User', 'Agent'];

export default function AuditLogPage() {
  const [params, setParams] = useSearchParams();
  const entityType = params.get('entityType') || '';
  const { page, setPage } = usePageParam(entityType);

  const setEntityType = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('entityType', value);
    else next.delete('entityType');
    next.delete('page');
    setParams(next, { replace: true });
  };

  const qs = new URLSearchParams({ pageSize: '20', page: String(page) });
  if (entityType) qs.set('entityType', entityType);
  const { data, loading, error, refetch } = useApi(`/audit-logs?${qs.toString()}`);

  return (
    <div>
      <h1 className="text-2xl">Activity log</h1>
      <p className="mt-1 text-sm text-ink-soft">
        A record of approvals, account changes, assignments, and document uploads.
      </p>

      <div className="mt-4">
        <Select
          className="w-48"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          aria-label="Filter by type"
        >
          <option value="">All activity</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
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
        {!loading && !error && (
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink/[0.03] text-left text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Summary</th>
                  <th className="px-3 py-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data?.data.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-ink-soft">
                      {formatDateTime(l.createdAt)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{l.action}</td>
                    <td className="px-3 py-2">{l.summary}</td>
                    <td className="px-3 py-2 text-ink-soft">{l.actor}</td>
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
