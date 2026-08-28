import { useState } from 'react';
import { Field, Input, Button } from '../ui/index.js';

export function LocationEditor({ location, onSave, saving, error }) {
  const [form, setForm] = useState(() => ({
    addressLine1: location?.addressLine1 ?? '',
    addressLine2: location?.addressLine2 ?? '',
    city: location?.city ?? '',
    state: location?.state ?? '',
    postalCode: location?.postalCode ?? '',
    country: location?.country ?? 'USA',
    neighborhood: location?.neighborhood ?? '',
    latitude: location?.latitude ?? '',
    longitude: location?.longitude ?? '',
  }));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const numOrNull = (v) => (v === '' || v == null ? null : Number(v));
    onSave({
      ...form,
      latitude: numOrNull(form.latitude),
      longitude: numOrNull(form.longitude),
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {error && (
        <p
          className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      <Field label="Address line 1">
        {(id) => <Input id={id} value={form.addressLine1} onChange={set('addressLine1')} />}
      </Field>
      <Field label="Address line 2">
        {(id) => <Input id={id} value={form.addressLine2} onChange={set('addressLine2')} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" required>
          {(id) => <Input id={id} value={form.city} onChange={set('city')} required />}
        </Field>
        <Field label="State or region">
          {(id) => <Input id={id} value={form.state} onChange={set('state')} />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Postal code">
          {(id) => <Input id={id} value={form.postalCode} onChange={set('postalCode')} />}
        </Field>
        <Field label="Country">
          {(id) => <Input id={id} value={form.country} onChange={set('country')} />}
        </Field>
        <Field label="Neighborhood">
          {(id) => <Input id={id} value={form.neighborhood} onChange={set('neighborhood')} />}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude" hint="Optional, used for the map">
          {(id) => (
            <Input id={id} type="number" step="any" value={form.latitude} onChange={set('latitude')} />
          )}
        </Field>
        <Field label="Longitude" hint="Optional, used for the map">
          {(id) => (
            <Input
              id={id}
              type="number"
              step="any"
              value={form.longitude}
              onChange={set('longitude')}
            />
          )}
        </Field>
      </div>

      <div>
        <Button type="submit" loading={saving}>
          Save location
        </Button>
      </div>
    </form>
  );
}
