import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/apiClient.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner, DataError, Badge } from '../../components/ui/index.js';
import { AgentProfileForm } from '../../components/agent/AgentProfileForm.jsx';
import { AgentPerformance } from '../../components/agent/AgentPerformance.jsx';

export default function AgentDetailPage() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refetch } = useApi(`/agents/${id}`);
  const saveMut = useMutation((body) => api.patch(`/agents/${id}`, body));
  const agent = data?.agent;

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (error) return <DataError message={error} onRetry={refetch} />;
  if (!agent) return null;

  return (
    <div className="max-w-2xl">
      <Link
        to="/admin/agents"
        className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
      >
        <ArrowLeft size={14} /> All agents
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl">
          {agent.user.firstName} {agent.user.lastName}
        </h1>
        <Badge tone={agent.status === 'ACTIVE' ? 'accent' : 'neutral'}>
          {agent.status.toLowerCase()}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {agent.user.email}
        {agent.user.phone ? ` · ${agent.user.phone}` : ''}
      </p>

      <div className="mt-6">
        <AgentPerformance performance={agent.performance} />
      </div>

      <div className="mt-8">
        <h2 className="text-base">Profile</h2>
        <div className="mt-3">
          <AgentProfileForm
            agent={agent}
            mode="admin"
            saving={saveMut.loading}
            error={saveMut.error}
            onSave={async (body) => {
              try {
                await saveMut.run(body);
                toast.success('Agent updated');
                refetch();
              } catch {
                /* inline */
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
