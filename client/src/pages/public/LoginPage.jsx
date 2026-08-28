import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../lib/apiClient.js';
import { Button, Input, Field } from '../../components/ui/index.js';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      // Staff land in their portal; customers go where they were headed.
      const staffAdmin = user.roles.some((r) => ['ADMINISTRATOR', 'SUPER_ADMIN'].includes(r));
      const staffAgent = user.roles.some((r) => ['AGENT', 'PROPERTY_MANAGER'].includes(r));
      navigate(staffAdmin ? '/admin' : staffAgent ? '/agent' : next, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not sign in'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <h1 className="text-2xl">Sign in</h1>
      <p className="mt-1 text-sm text-ink-soft">Agents and administrators use the same sign in.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
        {error && (
          <p
            className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}

        <Field label="Email">
          {(id) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              required
            />
          )}
        </Field>

        <Field label="Password">
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={set('password')}
              required
            />
          )}
        </Field>

        <Button type="submit" loading={submitting}>
          Sign in
        </Button>
      </form>

      <p className="mt-4 text-sm text-ink-soft">
        New here?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
