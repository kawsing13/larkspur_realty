import { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft, EnvelopeSimple, Phone } from '@phosphor-icons/react';
import { api } from '../../lib/apiClient.js';
import { useApi } from '../../hooks/useApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner, DataError } from '../../components/ui/index.js';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge.jsx';
import { AppointmentActions } from '../../components/appointment/AppointmentActions.jsx';
import { formatDateTime } from '../../lib/format.js';

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const { user, hasRole } = useAuth();
  const base = location.pathname.startsWith('/admin') ? '/admin' : '/agent';

  const { data, loading, error, refetch } = useApi(`/appointments/${id}`);
  const appt = data?.appointment;
  const [busy, setBusy] = useState(null);

  if (loading) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Spinner />
      </div>
    );
  }
  if (error) return <DataError message={error} onRetry={refetch} />;
  if (!appt) return null;

  const isStaffOwner =
    hasRole('ADMINISTRATOR', 'SUPER_ADMIN') || (user?.agentId && appt.agent?.id === user.agentId);

  const runAction = async (action, payload = {}) => {
    setBusy(action);
    try {
      await api.post(`/appointments/${id}/${action}`, payload);
      toast.success('Viewing updated');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Could not update the viewing');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <Link
        to={`${base}/appointments`}
        className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
      >
        <ArrowLeft size={14} /> All viewings
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">Viewing with {appt.contactName}</h1>
          <div className="mt-1 flex flex-wrap gap-4 text-sm">
            <a
              href={`mailto:${appt.contactEmail}`}
              className="flex items-center gap-1.5 text-accent hover:underline"
            >
              <EnvelopeSimple size={14} /> {appt.contactEmail}
            </a>
            {appt.contactPhone && (
              <a
                href={`tel:${appt.contactPhone}`}
                className="flex items-center gap-1.5 text-accent hover:underline"
              >
                <Phone size={14} /> {appt.contactPhone}
              </a>
            )}
          </div>
        </div>
        <AppointmentStatusBadge status={appt.status} />
      </div>

      <dl className="mt-6 grid gap-x-8 sm:grid-cols-2">
        <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
          <dt className="text-ink-soft">Requested</dt>
          <dd className="font-mono">{formatDateTime(appt.requestedStart)}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
          <dt className="text-ink-soft">Confirmed</dt>
          <dd className="font-mono">
            {appt.confirmedStart ? formatDateTime(appt.confirmedStart) : 'not yet'}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
          <dt className="text-ink-soft">Property</dt>
          <dd>
            <Link
              to={`${base}/properties/${appt.property?.id}`}
              className="text-accent hover:underline"
            >
              {appt.property?.reference}
            </Link>
          </dd>
        </div>
        {appt.inquiryId && (
          <div className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
            <dt className="text-ink-soft">Lead</dt>
            <dd>
              <Link
                to={`${base}/leads/${appt.inquiryId}`}
                className="text-accent hover:underline"
              >
                Open lead
              </Link>
            </dd>
          </div>
        )}
      </dl>

      {appt.notes && (
        <div className="mt-4 rounded border border-line bg-surface p-3 text-sm text-ink-soft">
          {appt.notes}
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-base">Actions</h2>
        <div className="mt-3">
          <AppointmentActions
            appointment={appt}
            canManage={isStaffOwner}
            canCancel={false}
            onAction={runAction}
            busy={busy}
          />
        </div>
      </div>
    </div>
  );
}
