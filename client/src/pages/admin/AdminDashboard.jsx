import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { Spinner } from '../../components/ui/Spinner.jsx';

function StatCard({ label, value, loading, to }) {
  const body = (
    <>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-mono text-2xl">{loading ? <Spinner size={18} /> : value}</p>
    </>
  );
  const cls = 'block rounded border border-line bg-surface p-4';
  return to ? (
    <Link to={to} className={`${cls} transition-colors hover:border-ink-soft`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export default function AdminDashboard() {
  const review = useApi('/listings?status=PENDING_REVIEW&pageSize=1');
  const newLeads = useApi('/inquiries?status=NEW&pageSize=1');
  const dueLeads = useApi('/inquiries?followUpDue=true&pageSize=1');
  const viewingRequests = useApi('/appointments?status=REQUESTED&pageSize=1');
  const published = useApi('/properties/manage?status=PUBLISHED&pageSize=1');
  const users = useApi('/users?pageSize=1');

  return (
    <div>
      <h1 className="text-2xl">Administration</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Awaiting review"
          value={review.data?.total ?? '-'}
          loading={review.loading}
          to="/admin/review"
        />
        <StatCard
          label="New leads"
          value={newLeads.data?.total ?? '-'}
          loading={newLeads.loading}
          to="/admin/leads?status=NEW"
        />
        <StatCard
          label="Follow-ups due"
          value={dueLeads.data?.total ?? '-'}
          loading={dueLeads.loading}
          to="/admin/leads?followUpDue=true"
        />
        <StatCard
          label="Viewing requests"
          value={viewingRequests.data?.total ?? '-'}
          loading={viewingRequests.loading}
          to="/admin/appointments?status=REQUESTED"
        />
        <StatCard
          label="Published"
          value={published.data?.total ?? '-'}
          loading={published.loading}
          to="/admin/properties?status=PUBLISHED"
        />
        <StatCard
          label="User accounts"
          value={users.data?.total ?? '-'}
          loading={users.loading}
          to="/admin/users"
        />
      </div>

      <div className="mt-6 rounded border border-dashed border-line p-6 text-sm text-ink-soft">
        The full platform is built: property management and the approval workflow, the lead
        CRM, viewings, agents, documents, and the <Link to="/admin/reports" className="text-accent hover:underline">reports</Link> and <Link to="/admin/audit" className="text-accent hover:underline">activity log</Link>.
      </div>
    </div>
  );
}
