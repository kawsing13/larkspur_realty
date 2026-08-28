import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, EnvelopeSimple, Phone } from '@phosphor-icons/react';
import { api } from '../../lib/apiClient.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Button, Textarea, Spinner, DataError } from '../../components/ui/index.js';
import { LeadStatusBadge } from '../../components/lead/LeadStatusBadge.jsx';
import { LeadPipeline } from '../../components/lead/LeadPipeline.jsx';
import { LeadTimeline } from '../../components/lead/LeadTimeline.jsx';
import { AssignAgentModal } from '../../components/lead/AssignAgentModal.jsx';
import { ViewingFormModal } from '../../components/appointment/ViewingFormModal.jsx';
import { formatDate } from '../../lib/format.js';

// Shared by the agent and admin portals.
export default function LeadDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const { user, hasRole } = useAuth();
  const base = location.pathname.startsWith('/admin') ? '/admin' : '/agent';
  const canAssign = hasRole('ADMINISTRATOR', 'SUPER_ADMIN');

  const { data, loading, error, refetch } = useApi(`/inquiries/${id}`);
  const inquiry = data?.inquiry;

  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(null); // 'status' | 'note' | 'followup'
  const [assignOpen, setAssignOpen] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (error) return <DataError message={error} onRetry={refetch} />;
  if (!inquiry) return null;

  const isAssigned = user?.agentId && inquiry.assignedAgent?.id === user.agentId;
  const canWrite = canAssign || isAssigned;

  const followUpValue = inquiry.followUpDate
    ? new Date(inquiry.followUpDate).toISOString().slice(0, 10)
    : '';

  const patch = async (body, which) => {
    setBusy(which);
    try {
      await api.patch(`/inquiries/${id}`, body);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Could not update the lead');
    } finally {
      setBusy(null);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy('note');
    try {
      await api.post(`/inquiries/${id}/notes`, { body: note.trim() });
      setNote('');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Could not add the note');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-3xl">
      <Link
        to={`${base}/leads`}
        className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
      >
        <ArrowLeft size={14} /> All leads
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">{inquiry.name}</h1>
          <div className="mt-1 flex flex-wrap gap-4 text-sm">
            <a
              href={`mailto:${inquiry.email}`}
              className="flex items-center gap-1.5 text-accent hover:underline"
            >
              <EnvelopeSimple size={14} /> {inquiry.email}
            </a>
            {inquiry.phone && (
              <a
                href={`tel:${inquiry.phone}`}
                className="flex items-center gap-1.5 text-accent hover:underline"
              >
                <Phone size={14} /> {inquiry.phone}
              </a>
            )}
          </div>
        </div>
        <LeadStatusBadge status={inquiry.status} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-8">
          {/* their message */}
          <div className="rounded border border-line bg-surface p-4">
            <p className="text-xs text-ink-soft">
              Received {formatDate(inquiry.createdAt)} via {inquiry.source.toLowerCase()}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm">{inquiry.message}</p>
          </div>

          {/* pipeline */}
          <div>
            <h2 className="text-base">Stage</h2>
            <div className="mt-3">
              {canWrite ? (
                <LeadPipeline
                  status={inquiry.status}
                  busy={busy === 'status'}
                  onChange={(next) => patch({ status: next }, 'status')}
                />
              ) : (
                <p className="text-sm text-ink-soft">
                  This lead is assigned to {inquiry.assignedAgent?.name || 'another agent'}.
                </p>
              )}
            </div>
          </div>

          {/* follow-up */}
          {canWrite && (
            <div>
              <h2 className="text-base">Follow-up date</h2>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="date"
                  value={followUpValue}
                  disabled={busy === 'followup'}
                  onChange={(e) =>
                    patch(
                      {
                        followUpDate: e.target.value
                          ? new Date(`${e.target.value}T12:00:00Z`).toISOString()
                          : null,
                      },
                      'followup',
                    )
                  }
                  className="h-10 rounded-sm border border-line bg-surface px-3 text-sm"
                />
                {inquiry.followUpDate && (
                  <button
                    onClick={() => patch({ followUpDate: null }, 'followup')}
                    className="text-xs text-ink-soft hover:text-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* timeline + add note */}
          <div>
            <h2 className="text-base">Activity</h2>
            {canWrite && (
              <div className="mt-3 flex flex-col gap-2">
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note about a call, email, or next step."
                />
                <div>
                  <Button onClick={addNote} loading={busy === 'note'} disabled={!note.trim()}>
                    Add note
                  </Button>
                </div>
              </div>
            )}
            <div className="mt-5">
              <LeadTimeline items={inquiry.timeline} />
            </div>
          </div>
        </div>

        {/* sidebar */}
        <aside className="flex flex-col gap-4">
          {inquiry.property && (
            <div className="rounded border border-line bg-surface p-3">
              <p className="text-xs text-ink-soft">Property</p>
              <Link
                to={`${base}/properties/${inquiry.property.id}`}
                className="mt-1 block text-sm text-accent hover:underline"
              >
                {inquiry.property.title}
              </Link>
              <p className="mt-0.5 font-mono text-xs text-ink-soft">{inquiry.property.reference}</p>
            </div>
          )}

          <div className="rounded border border-line bg-surface p-3">
            <p className="text-xs text-ink-soft">Assigned to</p>
            <p className="mt-1 text-sm">{inquiry.assignedAgent?.name || 'Unassigned'}</p>
            {canAssign && (
              <Button variant="secondary" className="mt-2 h-8 px-3" onClick={() => setAssignOpen(true)}>
                Reassign
              </Button>
            )}
          </div>

          {canWrite && inquiry.property && (
            <Button variant="secondary" onClick={() => setViewingOpen(true)}>
              Schedule a viewing
            </Button>
          )}

          {inquiry.customer && (
            <div className="rounded border border-line bg-surface p-3">
              <p className="text-xs text-ink-soft">Registered customer</p>
              <p className="mt-1 text-sm">{inquiry.customer.name}</p>
            </div>
          )}
        </aside>
      </div>

      <AssignAgentModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        inquiryId={id}
        currentAgentName={inquiry.assignedAgent?.name}
        onAssigned={() => {
          setAssignOpen(false);
          toast.success('Lead reassigned');
          refetch();
        }}
      />

      {inquiry.property && (
        <ViewingFormModal
          open={viewingOpen}
          onClose={() => setViewingOpen(false)}
          propertyId={inquiry.property.id}
          inquiryId={id}
          defaultContact={{ name: inquiry.name, email: inquiry.email, phone: inquiry.phone }}
          title="Schedule a viewing"
          submitLabel="Schedule"
          onDone={() => {
            setViewingOpen(false);
            toast.success('Viewing scheduled');
            refetch();
          }}
        />
      )}
    </div>
  );
}
