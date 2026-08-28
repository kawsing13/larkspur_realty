import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi.js';
import { api } from '../../lib/apiClient.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner, DataError } from '../../components/ui/index.js';
import { AgentProfileForm } from '../../components/agent/AgentProfileForm.jsx';
import { AgentPerformance } from '../../components/agent/AgentPerformance.jsx';

export default function AgentProfilePage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useApi('/agents/me');
  const saveMut = useMutation((body) => api.patch('/agents/me', body));
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
    <div>
      <h1 className="text-2xl">My profile</h1>
      <p className="mt-1 text-sm text-ink-soft">
        This is what buyers see next to your listings.{' '}
        <Link to={`/agents/${agent.id}`} className="text-accent hover:underline">
          View public page
        </Link>
      </p>

      <div className="mt-6">
        <AgentPerformance performance={agent.performance} />
      </div>

      <div className="mt-8">
        <AgentProfileForm
          agent={agent}
          mode="self"
          saving={saveMut.loading}
          error={saveMut.error}
          onSave={async (body) => {
            try {
              await saveMut.run(body);
              toast.success('Profile saved');
              refetch();
            } catch {
              /* inline */
            }
          }}
        />
      </div>
    </div>
  );
}
