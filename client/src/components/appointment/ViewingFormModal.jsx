import { useState } from 'react';
import { api, errorMessage } from '../../lib/apiClient.js';
import { Modal, Button, Input, Textarea, Field } from '../ui/index.js';

// Used two ways:
//   public "request a viewing" from a listing page  (no inquiryId)
//   staff "schedule a viewing" for a lead           (inquiryId set -> confirmed straight away)
export function ViewingFormModal({
  open,
  onClose,
  propertyId,
  inquiryId,
  defaultContact = {},
  onDone,
  title = 'Request a viewing',
  submitLabel = 'Send request',
}) {
  const [form, setForm] = useState(() => ({
    start: '',
    contactName: defaultContact.name || '',
    contactEmail: defaultContact.email || '',
    contactPhone: defaultContact.phone || '',
    notes: '',
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/appointments', {
        propertyId,
        inquiryId: inquiryId || undefined,
        requestedStart: new Date(form.start).toISOString(),
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone || undefined,
        notes: form.notes || undefined,
      });
      onDone();
    } catch (err) {
      setError(errorMessage(err, 'Could not book that viewing'));
    } finally {
      setBusy(false);
    }
  };

  const ready = form.start && form.contactName && form.contactEmail;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={busy} disabled={!ready} onClick={submit}>
            {submitLabel}
          </Button>
        </>
      }
    >
      {error && (
        <p className="mb-3 rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Field label={inquiryId ? 'Date and time' : 'Preferred date and time'}>
          {(id) => (
            <Input id={id} type="datetime-local" value={form.start} onChange={set('start')} />
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            {(id) => <Input id={id} value={form.contactName} onChange={set('contactName')} />}
          </Field>
          <Field label="Phone" hint="Optional">
            {(id) => <Input id={id} type="tel" value={form.contactPhone} onChange={set('contactPhone')} />}
          </Field>
        </div>
        <Field label="Email">
          {(id) => (
            <Input id={id} type="email" value={form.contactEmail} onChange={set('contactEmail')} />
          )}
        </Field>
        <Field label="Note" hint="Optional">
          {(id) => <Textarea id={id} rows={2} value={form.notes} onChange={set('notes')} />}
        </Field>
      </div>
    </Modal>
  );
}
