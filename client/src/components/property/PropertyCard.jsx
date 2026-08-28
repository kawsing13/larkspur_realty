import { Link } from 'react-router-dom';
import { MapPin } from '@phosphor-icons/react';
import { FavoriteButton } from './FavoriteButton.jsx';
import { formatMoney, formatArea } from '../../lib/format.js';

// A premium listing card: photography leads, the price is bold, the title is set
// in the display serif, and the reference stays quiet at the foot.
export function PropertyCard({ property, showFavorite = true }) {
  const {
    reference,
    title,
    price,
    currency,
    listingMode,
    bedrooms,
    bathrooms,
    floorAreaSqm,
    lotAreaSqm,
    location,
    coverImage,
    propertyType,
  } = property;

  const place = [location?.neighborhood, location?.city, location?.state].filter(Boolean).join(', ');
  const forRent = listingMode === 'RENT';

  const stats = [];
  if (bedrooms === 0) stats.push('Studio');
  else if (bedrooms != null) stats.push(`${bedrooms} bd`);
  if (bathrooms != null) stats.push(`${bathrooms} ba`);
  if (floorAreaSqm != null) stats.push(formatArea(floorAreaSqm));
  else if (lotAreaSqm != null) stats.push(`${formatArea(lotAreaSqm)} lot`);
  if (stats.length === 0 && propertyType?.name) stats.push(propertyType.name);

  return (
    <Link
      to={`/listings/${reference}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-line bg-surface transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:warm-shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
        {coverImage && (
          <img
            src={coverImage}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[400ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        {showFavorite && (
          <FavoriteButton propertyId={property.id} size={16} className="absolute right-3 top-3" />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink shadow-sm backdrop-blur">
          {forRent ? 'For rent' : 'For sale'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="font-sans text-lg font-semibold text-ink">
          {formatMoney(price, currency, listingMode)}
        </p>
        <h3 className="font-display text-lg leading-snug text-ink">{title}</h3>
        {place && (
          <p className="flex items-center gap-1 text-sm text-ink-soft">
            <MapPin size={14} weight="fill" className="text-ink-soft/70" />
            {place}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2 text-sm text-ink-soft">
          {stats.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-line" />}
              {s}
            </span>
          ))}
        </div>
        <p className="font-mono text-[11px] text-ink-soft/70">{reference}</p>
      </div>
    </Link>
  );
}
