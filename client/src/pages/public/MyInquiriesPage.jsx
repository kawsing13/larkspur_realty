import { Link } from 'react-router-dom';
import { ChatCircle } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { Spinner, DataError, EmptyState, Button } from '../../components/ui/index.js';
import { LeadStatusBadge } from '../../components/lead/LeadStatusBadge.jsx';
import { formatDate } from '../../lib/format.js';

export default function MyInquiriesPage() {
  const { data, loading, error, refetch } = useApi('/inquiries/mine');

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <h1 className="text-2xl">My inquiries</h1>
      <p className="mt-1 text-sm text-ink-soft">Messages you have sent about listings.</p>

      <div className="mt-6 flex flex-col gap-3">
        {loading && (
          <div className="py-6 text-center">
            <Spinner />
          </div>
        )}
        {!loading && error && <DataError message={error} onRetry={refetch} />}

        {!loading && !error && data?.data.length === 0 && (
          <EmptyState
            icon={ChatCircle}
            title="No inquiries yet"
            action={
              <Button as={Link} to="/search">
                Browse listings
              </Button>
            }
          >
            When you message an agent about a listing, it shows up here with its status.
          </EmptyState>
        )}

        {!loading &&
          !error &&
          data?.data.map((i) => (
            <div key={i.id} className="rounded border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  to={`/listings/${i.property.reference}`}
                  className="font-medium text-accent hover:underline"
                >
                  {i.property.title}
                </Link>
                <LeadStatusBadge status={i.status} />
              </div>
              <p className="mt-1 font-mono text-xs text-ink-soft">
                {i.property.reference} · {formatDate(i.createdAt)}
              </p>
              <p className="mt-2 text-sm text-ink-soft">{i.message}</p>
              {i.agent && (
                <p className="mt-2 text-xs text-ink-soft">Being handled by {i.agent}</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
