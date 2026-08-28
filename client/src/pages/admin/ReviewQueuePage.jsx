import { Link } from 'react-router-dom';
import { ClipboardText } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import { Button, Spinner, DataError, EmptyState, Pagination } from '../../components/ui/index.js';
import { formatMoney, formatDate } from '../../lib/format.js';

// Listings agents have submitted and are waiting for an administrator to review.
export default function ReviewQueuePage() {
  const { page, setPage } = usePageParam();
  const { data, loading, error, refetch } = useApi(
    `/listings?status=PENDING_REVIEW&pageSize=20&page=${page}`,
  );

  return (
    <div>
      <h1 className="text-2xl">Awaiting review</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Listings agents have submitted. Open one to approve it or send it back with a note.
      </p>

      <div className="mt-6">
        {loading && (
          <div className="py-10 text-center">
            <Spinner />
          </div>
        )}

        {!loading && error && <DataError message={error} onRetry={refetch} />}

        {!loading && !error && data?.data.length === 0 && (
          <EmptyState icon={ClipboardText} title="Nothing to review right now">
            When an agent submits a listing it shows up here.
          </EmptyState>
        )}

        {!loading && !error && data?.data.length > 0 && (
          <div className="overflow-x-auto rounded border border-line">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-ink/[0.03] text-left text-ink-soft">
                <tr>
                  <th className="px-3 py-2 font-medium">Reference</th>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Agent</th>
                  <th className="px-3 py-2 font-medium">Price</th>
                  <th className="px-3 py-2 font-medium">Submitted</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((l) => (
                  <tr key={l.id} className="hover:bg-ink/[0.02]">
                    <td className="px-3 py-2 font-mono text-xs">{l.property.reference}</td>
                    <td className="px-3 py-2">{l.property.title}</td>
                    <td className="px-3 py-2 text-ink-soft">{l.property.agent || '-'}</td>
                    <td className="px-3 py-2 font-mono">
                      {formatMoney(l.property.price, l.property.currency, l.property.listingMode)}
                    </td>
                    <td className="px-3 py-2 text-ink-soft">{formatDate(l.submittedAt)}</td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        as={Link}
                        to={`/admin/properties/${l.property.id}?tab=review`}
                        variant="secondary"
                      >
                        Review
                      </Button>
                    </td>
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
