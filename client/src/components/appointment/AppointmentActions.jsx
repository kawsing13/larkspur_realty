import { useState } from 'react';
import { Button, Modal, Input, Field } from '../ui/index.js';
import { toDateTimeLocal } from '../../lib/format.js';

// Workflow buttons for an appointment. `onAction(action, { start } | { note })`.
// Staff get confirm / reschedule / complete / cancel / no-show; the owning
// customer gets reschedule / cancel.
export function AppointmentActions({ appointment, canManage, canCancel, onAction, busy }) {
  const [timeFor, setTimeFor] = useState(null); // 'confirm' | 'reschedule' | null
  const [start, setStart] = useState('');

  const openTime = (action) => {
    setStart(toDateTimeLocal(appointment.confirmedStart || appointment.requestedStart));
    setTimeFor(action);
  };

  const s = appointment.status;
  const buttons = [];

  if (canManage && (s === 'REQUESTED' || s === 'RESCHEDULED')) {
    buttons.push(
      <Button key="confirm" loading={busy === 'confirm'} onClick={() => openTime('confirm')}>
        Confirm time
      </Button>,
    );
  }
  if (canManage && s === 'CONFIRMED') {
    buttons.push(
      <Button key="complete" loading={busy === 'complete'} onClick={() => onAction('complete')}>
        Mark completed
      </Button>,
    );
    buttons.push(
      <Button
        key="noshow"
        variant="secondary"
        loading={busy === 'no-show'}
        onClick={() => onAction('no-show')}
      >
        No-show
      </Button>,
    );
  }
  if ((canManage || canCancel) && ['REQUESTED', 'CONFIRMED', 'RESCHEDULED'].includes(s)) {
    buttons.push(
      <Button
        key="reschedule"
        variant="secondary"
        loading={busy === 'reschedule'}
        onClick={() => openTime('reschedule')}
      >
        Reschedule
      </Button>,
    );
    buttons.push(
      <Button key="cancel" variant="ghost" loading={busy === 'cancel'} onClick={() => onAction('cancel')}>
        Cancel
      </Button>,
    );
  }

  return (
    <div>
      {buttons.length > 0 ? (
        <div className="flex flex-wrap gap-2">{buttons}</div>
      ) : (
        <p className="text-sm text-ink-soft">No actions available.</p>
      )}

      <Modal
        open={!!timeFor}
        onClose={() => setTimeFor(null)}
        title={timeFor === 'confirm' ? 'Confirm the viewing time' : 'Propose a new time'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTimeFor(null)}>
              Cancel
            </Button>
            <Button
              loading={busy === timeFor}
              disabled={!start}
              onClick={async () => {
                await onAction(timeFor, { start: new Date(start).toISOString() });
                setTimeFor(null);
              }}
            >
              {timeFor === 'confirm' ? 'Confirm' : 'Send new time'}
            </Button>
          </>
        }
      >
        <Field label="Date and time">
          {(id) => (
            <Input
              id={id}
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          )}
        </Field>
      </Modal>
    </div>
  );
}
