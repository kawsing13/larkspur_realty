import { useState } from 'react';
import { Field, Input, Select, Textarea, Button } from '../ui/index.js';
import { sqmToSqft, sqftToSqm } from '../../lib/format.js';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

// The core property fields. `property` is null when creating.
// `types` is the array from GET /api/property-types.
export function PropertyForm({
  property,
  types,
  onSubmit,
  submitting,
  error,
  submitLabel = 'Save',
}) {
  const [form, setForm] = useState(() => ({
    title: property?.title ?? '',
    description: property?.description ?? '',
    propertyTypeId: property?.propertyType?.id ?? property?.propertyTypeId ?? '',
    listingMode: property?.listingMode ?? 'SALE',
    price: property?.price ?? '',
    currency: property?.currency ?? 'USD',
    bedrooms: property?.bedrooms ?? '',
    bathrooms: property?.bathrooms ?? '',
    floorAreaSqft: sqmToSqft(property?.floorAreaSqm ?? null),
    lotAreaSqft: sqmToSqft(property?.lotAreaSqm ?? null),
    yearBuilt: property?.yearBuilt ?? '',
  }));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const intOrNull = (v) => (v === '' || v == null ? null : Number.parseInt(v, 10));
    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      propertyTypeId: form.propertyTypeId,
      listingMode: form.listingMode,
      price: Number(form.price),
      currency: form.currency,
      bedrooms: intOrNull(form.bedrooms),
      bathrooms: intOrNull(form.bathrooms),
      floorAreaSqm: sqftToSqm(form.floorAreaSqft),
      lotAreaSqm: sqftToSqm(form.lotAreaSqft),
      yearBuilt: intOrNull(form.yearBuilt),
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

      <Field label="Title" required>
        {(id) => (
          <Input id={id} value={form.title} onChange={set('title')} maxLength={160} required />
        )}
      </Field>

      <Field label="Description" required hint="What makes this property worth a visit">
        {(id) => (
          <Textarea id={id} value={form.description} onChange={set('description')} rows={6} required />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Property type" required>
          {(id) => (
            <Select id={id} value={form.propertyTypeId} onChange={set('propertyTypeId')} required>
              <option value="" disabled>
                Choose a type
              </option>
              {types?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Listing type" required>
          {(id) => (
            <Select id={id} value={form.listingMode} onChange={set('listingMode')}>
              <option value="SALE">For sale</option>
              <option value="RENT">For rent</option>
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
        <Field label={form.listingMode === 'RENT' ? 'Monthly rent' : 'Price'} required>
          {(id) => (
            <Input
              id={id}
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={set('price')}
              required
            />
          )}
        </Field>
        <Field label="Currency">
          {(id) => (
            <Select id={id} value={form.currency} onChange={set('currency')}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Bedrooms" hint="Blank for land">
          {(id) => (
            <Input id={id} type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} />
          )}
        </Field>
        <Field label="Bathrooms">
          {(id) => (
            <Input id={id} type="number" min="0" value={form.bathrooms} onChange={set('bathrooms')} />
          )}
        </Field>
        <Field label="Year built">
          {(id) => (
            <Input id={id} type="number" min="1700" value={form.yearBuilt} onChange={set('yearBuilt')} />
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Floor area (sq ft)">
          {(id) => (
            <Input
              id={id}
              type="number"
              min="0"
              value={form.floorAreaSqft}
              onChange={set('floorAreaSqft')}
            />
          )}
        </Field>
        <Field label="Lot area (sq ft)">
          {(id) => (
            <Input
              id={id}
              type="number"
              min="0"
              value={form.lotAreaSqft}
              onChange={set('lotAreaSqft')}
            />
          )}
        </Field>
      </div>

      <div>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
