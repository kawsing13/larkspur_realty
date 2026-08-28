import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { Spinner, Button } from '../../components/ui/index.js';

function StatCard({ label, value, loading, to }) {
  return (
    <Link
      to={to}
      className="block rounded border border-line bg-surface p-4 transition-colors hover:border-ink-soft"
    >
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-mono text-2xl">{loading ? <Spinner size={18} /> : value}</p>
    </Link>
  );
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const props = useApi('/properties/manage?scope=mine&pageSize=1');
  const published = useApi('/properties/manage?scope=mine&status=PUBLISHED&pageSize=1');
  const changes = useApi('/properties/manage?scope=mine&status=CHANGES_REQUESTED&pageSize=1');
  const newLeads = useApi('/inquiries?scope=mine&status=NEW&pageSize=1');
  const dueLeads = useApi('/inquiries?scope=mine&followUpDue=true&pageSize=1');
  const viewingRequests = useApi('/appointments?scope=mine&status=REQUESTED&pageSize=1');
  const upcomingViewings = useApi('/appointments?scope=mine&upcoming=true&pageSize=1');

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Agent workspace</h1>
          <p className="mt-1 text-ink-soft">Welcome back, {user?.firstName}.</p>
        </div>
        <Button as={Link} to="/agent/properties/new">
          New property
        </Button>
      </div>

      <h2 className="mt-8 text-sm font-medium text-ink-soft">Leads and viewings</h2>
      <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="New leads"
          value={newLeads.data?.total ?? '-'}
          loading={newLeads.loading}
          to="/agent/leads?status=NEW"
        />
        <StatCard
          label="Follow-ups due"
          value={dueLeads.data?.total ?? '-'}
          loading={dueLeads.loading}
          to="/agent/leads?followUpDue=true"
        />
        <StatCard
          label="Viewing requests"
          value={viewingRequests.data?.total ?? '-'}
          loading={viewingRequests.loading}
          to="/agent/appointments?status=REQUESTED"
        />
        <StatCard
          label="Upcoming viewings"
          value={upcomingViewings.data?.total ?? '-'}
          loading={upcomingViewings.loading}
          to="/agent/appointments"
        />
      </div>

      <h2 className="mt-8 text-sm font-medium text-ink-soft">Properties</h2>
      <div className="mt-2 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="My properties"
          value={props.data?.total ?? '-'}
          loading={props.loading}
          to="/agent/properties"
        />
        <StatCard
          label="Published"
          value={published.data?.total ?? '-'}
          loading={published.loading}
          to="/agent/properties?status=PUBLISHED"
        />
        <StatCard
          label="Needs changes"
          value={changes.data?.total ?? '-'}
          loading={changes.loading}
          to="/agent/properties?status=CHANGES_REQUESTED"
        />
      </div>

      <div className="mt-8 rounded border border-dashed border-line p-6 text-sm text-ink-soft">
        Viewings and appointments arrive in Phase 6. Property management and lead handling are
        working now.
      </div>
    </div>
  );
}
