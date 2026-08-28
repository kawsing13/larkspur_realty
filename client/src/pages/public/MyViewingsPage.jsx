import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarBlank } from '@phosphor-icons/react';
import { api } from '../../lib/apiClient.js';
import { useApi } from '../../hooks/useApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner, DataError, EmptyState, Button } from '../../components/ui/index.js';
import { AppointmentStatusBadge } from '../../components/appointment/AppointmentStatusBadge.jsx';
import { formatDateTime } from '../../lib/format.js';

export default function MyViewingsPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useApi('/appointments/mine');
  const [busy, setBusy] = useState(null);

  const cancel = async (appointmentId) => {
    setBusy(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/cancel`);
      toast.success('Viewing cancelled');
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || 'Could not cancel');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <h1 className="text-2xl">My viewings</h1>
      <p className="mt-1 text-sm text-ink-soft">Property viewings you have requested.</p>

      <div className="mt-6 flex flex-col gap-3">
        {loading && (
          <div className="py-6 text-center">
            <Spinner />
          </div>
        )}
        {!loading && error && <DataError message={error} onRetry={refetch} />}

        {!loading && !error && data?.data.length === 0 && (
          <EmptyState
            icon={CalendarBlank}
            title="No viewings yet"
            action={
              <Button as={Link} to="/search">
                Browse listings
              </Button>
            }
          >
            Request a viewing from any listing and it will show up here.
          </EmptyState>
        )}

        {!loading &&
          !error &&
          data?.data.map((a) => {
            const open = ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(a.status);
            return (
              <div key={a.id} className="rounded border border-line bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{a.property?.title}</span>
                  <AppointmentStatusBadge status={a.status} />
                </div>
                <p className="mt-1 font-mono text-xs text-ink-soft">{a.property?.reference}</p>
                <p className="mt-2 text-sm">
                  {a.confirmedStart
                    ? `Confirmed for ${formatDateTime(a.confirmedStart)}`
                    : `Requested for ${formatDateTime(a.requestedStart)}`}
                </p>
                {open && (
                  <Button
                    variant="ghost"
                    className="mt-2 h-8 px-2"
                    loading={busy === a.id}
                    onClick={() => cancel(a.id)}
                  >
                    Cancel this viewing
                  </Button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
