import { useState } from 'react';
import { api, errorMessage } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Input, Textarea, Field } from '../ui/index.js';

// The "ask about this listing" form on the public property page. Pre-fills the
// name and email for a signed-in customer; works for guests too.
export function InquiryForm({ propertyId, agentName }) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({
    name: user ? `${user.firstName} ${user.lastName}` : '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
  }));
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      await api.post('/inquiries', { propertyId, ...form, phone: form.phone || undefined });
      setState('sent');
    } catch (err) {
      setError(errorMessage(err, 'Could not send your message'));
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="rounded border border-accent/30 bg-accent/5 p-4 text-sm">
        <p className="font-medium text-accent">Message sent</p>
        <p className="mt-1 text-ink-soft">
          {agentName ? `${agentName} will be in touch soon.` : 'An agent will be in touch soon.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      {state === 'error' && (
        <p
          className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      <Field label="Name">
        {(id) => <Input id={id} value={form.name} onChange={set('name')} required />}
      </Field>
      <Field label="Email">
        {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} required />}
      </Field>
      <Field label="Phone" hint="Optional">
        {(id) => <Input id={id} type="tel" value={form.phone} onChange={set('phone')} />}
      </Field>
      <Field label="Message">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            value={form.message}
            onChange={set('message')}
            placeholder="Ask about a viewing, the price, or anything else."
            required
          />
        )}
      </Field>
      <Button type="submit" loading={state === 'sending'}>
        Send message
      </Button>
    </form>
  );
}
