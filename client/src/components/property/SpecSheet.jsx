import { formatArea, formatDate } from '../../lib/format.js';

// A property's specs as a two-column record sheet: label left, value right in
// mono, one hairline per row. Two columns keeps it a glance, not a long scroll.
export function SpecSheet({ property }) {
  const rows = [
    ['Type', property.propertyType?.name],
    ['Listing', property.listingMode === 'RENT' ? 'For rent' : 'For sale'],
    ['Bedrooms', property.bedrooms],
    ['Bathrooms', property.bathrooms],
    ['Floor area', property.floorAreaSqm != null ? formatArea(property.floorAreaSqm) : null],
    ['Lot area', property.lotAreaSqm != null ? formatArea(property.lotAreaSqm) : null],
    ['Year built', property.yearBuilt],
    ['Reference', property.reference],
    ['Published', property.publishedAt ? formatDate(property.publishedAt) : null],
  ].filter(([, value]) => value != null && value !== '');

  return (
    <dl className="mt-3 grid gap-x-8 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
          <dt className="text-ink-soft">{label}</dt>
          <dd className={label === 'Reference' ? 'font-mono text-ink-soft' : 'font-medium text-ink'}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
