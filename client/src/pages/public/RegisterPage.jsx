import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../lib/apiClient.js';
import { Button, Input, Field } from '../../components/ui/index.js';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // Drop an empty phone so the server sees it as absent, not "".
      await register({ ...form, phone: form.phone.trim() || undefined });
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not create the account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="text-2xl">Create an account</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Save favorites now. Inquiries and viewing requests open in the next release.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
        {error && (
          <p
            className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            {(id) => (
              <Input id={id} autoComplete="given-name" value={form.firstName} onChange={set('firstName')} required />
            )}
          </Field>
          <Field label="Last name">
            {(id) => (
              <Input id={id} autoComplete="family-name" value={form.lastName} onChange={set('lastName')} required />
            )}
          </Field>
        </div>

        <Field label="Email">
          {(id) => (
            <Input id={id} type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
          )}
        </Field>

        <Field label="Password" hint="At least 8 characters">
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set('password')}
              required
            />
          )}
        </Field>

        <Field label="Phone" hint="Optional">
          {(id) => (
            <Input id={id} type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} />
          )}
        </Field>

        <Button type="submit" loading={submitting}>
          Create account
        </Button>
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
