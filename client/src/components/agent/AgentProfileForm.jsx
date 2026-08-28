import { useState } from 'react';
import { Field, Input, Textarea, Select, Button } from '../ui/index.js';

// One form for both "an agent editing their own profile" (mode="self") and "an
// admin editing an agent" (mode="admin"). The visible fields differ slightly.
export function AgentProfileForm({ agent, mode, onSave, saving, error }) {
  const [form, setForm] = useState(() => ({
    title: agent?.title ?? '',
    bio: agent?.bio ?? '',
    photoUrl: agent?.photoUrl ?? '',
    phone: agent?.user?.phone ?? '',
    licenseNumber: agent?.licenseNumber ?? '',
    status: agent?.status ?? 'ACTIVE',
  }));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const payload =
      mode === 'self'
        ? { title: form.title, bio: form.bio, photoUrl: form.photoUrl, phone: form.phone }
        : {
            title: form.title,
            bio: form.bio,
            photoUrl: form.photoUrl,
            licenseNumber: form.licenseNumber,
            status: form.status,
          };
    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-4" noValidate>
      {error && (
        <p
          className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <Field label="Title" hint="Shown on your listings, e.g. Senior Agent">
        {(id) => <Input id={id} value={form.title} onChange={set('title')} maxLength={80} />}
      </Field>

      <Field label="About" hint="A short paragraph buyers see on your profile">
        {(id) => <Textarea id={id} value={form.bio} onChange={set('bio')} rows={5} maxLength={2000} />}
      </Field>

      <Field label="Photo URL" hint="Link to a headshot (optional)">
        {(id) => <Input id={id} type="url" value={form.photoUrl} onChange={set('photoUrl')} />}
      </Field>

      {mode === 'self' && (
        <Field label="Phone">
          {(id) => <Input id={id} type="tel" value={form.phone} onChange={set('phone')} />}
        </Field>
      )}

      {mode === 'admin' && (
        <>
          <Field label="License number">
            {(id) => (
              <Input id={id} value={form.licenseNumber} onChange={set('licenseNumber')} maxLength={60} />
            )}
          </Field>
          <Field label="Account status" hint="Inactive agents cannot be assigned new listings">
            {(id) => (
              <Select id={id} value={form.status} onChange={set('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            )}
          </Field>
        </>
      )}

      <div>
        <Button type="submit" loading={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}
