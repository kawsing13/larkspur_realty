import { Link } from 'react-router-dom';
import { FilePdf } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { openPdf } from '../../lib/apiClient.js';
import { Button, Spinner, DataError } from '../../components/ui/index.js';

const FUNNEL = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'VIEWING_SCHEDULED',
  'NEGOTIATION',
  'WON',
  'LOST',
];

function Metric({ label, value }) {
  return (
    <div className="rounded border border-line bg-surface p-4">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-mono text-2xl">{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const overview = useApi('/reports/overview');
  const agents = useApi('/reports/agents');
  const o = overview.data;

  if (overview.loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (overview.error) return <DataError message={overview.error} onRetry={overview.refetch} />;

  const funnelMax = Math.max(1, ...FUNNEL.map((s) => o.funnel[s] || 0));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">Reports</h1>
        <Button variant="secondary" onClick={() => openPdf('/reports/summary.pdf')}>
          <FilePdf size={16} /> Download PDF
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Active listings" value={o.activeListings} />
        <Metric label="Sold or rented" value={o.closed} />
        <Metric label="Agents" value={o.agents} />
        <Metric label="New inquiries" value={o.newInquiries} />
        <Metric label="Pending approvals" value={o.pendingApprovals} />
        <Metric label="Upcoming viewings" value={o.upcomingViewings} />
        <Metric label="Total leads" value={o.totalLeads} />
        <Metric label="Lead conversion" value={`${o.conversionRate}%`} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-lg">Lead funnel</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {FUNNEL.map((status) => {
              const n = o.funnel[status] || 0;
              return (
                <li key={status} className="flex items-center gap-3 text-sm">
                  <span className="w-36 text-ink-soft">
                    {status.replace(/_/g, ' ').toLowerCase()}
                  </span>
                  <span className="h-2 rounded-full bg-accent" style={{ width: `${(n / funnelMax) * 160}px` }} />
                  <span className="font-mono">{n}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section>
          <h2 className="text-lg">Most enquired listings</h2>
          <ul className="mt-3 divide-y divide-line rounded border border-line">
            {o.topProperties.length === 0 && (
              <li className="px-3 py-4 text-sm text-ink-soft">No inquiries yet.</li>
            )}
            {o.topProperties.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                <Link to={`/admin/properties/${p.id}`} className="min-w-0 truncate text-accent hover:underline">
                  {p.title || p.reference}
                </Link>
                <span className="font-mono text-ink-soft">{p.inquiries}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-lg">Agent performance</h2>
        <div className="mt-3 overflow-x-auto rounded border border-line">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-ink/[0.03] text-left text-ink-soft">
              <tr>
                <th className="px-3 py-2 font-medium">Agent</th>
                <th className="px-3 py-2 font-medium">Published</th>
                <th className="px-3 py-2 font-medium">Leads</th>
                <th className="px-3 py-2 font-medium">Won</th>
                <th className="px-3 py-2 font-medium">Viewings done</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {agents.loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center">
                    <Spinner size={16} />
                  </td>
                </tr>
              )}
              {agents.data?.data.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2">
                    <Link to={`/admin/agents/${a.id}`} className="text-accent hover:underline">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono">{a.published}</td>
                  <td className="px-3 py-2 font-mono">{a.leads}</td>
                  <td className="px-3 py-2 font-mono">{a.won}</td>
                  <td className="px-3 py-2 font-mono">{a.viewingsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
