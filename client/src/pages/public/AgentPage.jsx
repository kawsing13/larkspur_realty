import { useParams, Link } from 'react-router-dom';
import { EnvelopeSimple, Phone, House } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { usePageParam } from '../../hooks/usePageParam.js';
import { Spinner, DataError, EmptyState, Pagination } from '../../components/ui/index.js';
import { PropertyCard } from '../../components/property/PropertyCard.jsx';

export default function AgentPage() {
  const { id } = useParams();
  const { page, setPage } = usePageParam(id);
  const { data, loading, error, refetch } = useApi(`/agents/${id}/public?page=${page}`);

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-content px-4 py-16">
        <DataError message={error} onRetry={refetch} />
      </div>
    );
  }

  const { agent, listings } = data;
  const firstName = agent.name.split(' ')[0];

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <div className="flex flex-col gap-4 border-b border-line pb-8 sm:flex-row sm:items-start sm:gap-6">
        {agent.photoUrl ? (
          <img
            src={agent.photoUrl}
            alt={agent.name}
            className="h-24 w-24 shrink-0 rounded object-cover"
          />
        ) : (
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded bg-ink/5 font-display text-2xl text-ink-soft">
            {agent.name
              .split(' ')
              .map((p) => p[0])
              .join('')}
          </div>
        )}

        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
            Larkspur Realty
          </p>
          <h1 className="mt-1 text-2xl">{agent.name}</h1>
          {agent.title && <p className="text-ink-soft">{agent.title}</p>}
          {agent.bio && <p className="mt-3 max-w-2xl text-sm text-ink-soft">{agent.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="flex items-center gap-1.5 text-accent hover:underline"
              >
                <EnvelopeSimple size={15} /> {agent.email}
              </a>
            )}
            {agent.phone && (
              <a
                href={`tel:${agent.phone}`}
                className="flex items-center gap-1.5 text-accent hover:underline"
              >
                <Phone size={15} /> {agent.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-xl">
        {firstName}&rsquo;s listings ({listings.total})
      </h2>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.data.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={House}
              title="No active listings"
              action={
                <Link to="/search" className="text-accent hover:underline">
                  Browse all listings
                </Link>
              }
            />
          </div>
        )}
        {listings.data.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>

      <Pagination page={listings.page} totalPages={listings.totalPages} onChange={setPage} />
    </div>
  );
}
