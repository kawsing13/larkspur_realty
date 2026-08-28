// Shows the property location. With coordinates, it embeds an OpenStreetMap view
// (no API key needed). Without them, it falls back to the address as text.
//
// To use Mapbox or Google Maps in production instead, swap the iframe for their
// SDK here; nothing else needs to change.
export function PropertyMap({ latitude, longitude, address }) {
  const hasCoords = latitude != null && longitude != null;

  if (!hasCoords) {
    return (
      <div className="rounded border border-line bg-surface p-4 text-sm text-ink-soft">
        {address || 'Exact location shared after an inquiry.'}
      </div>
    );
  }

  const pad = 0.006;
  const bbox = [longitude - pad, latitude - pad, longitude + pad, latitude + pad].join(',');
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
  const full = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className="overflow-hidden rounded border border-line">
      <iframe
        title="Property location"
        src={embed}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-64 w-full border-0"
      />
      <div className="flex items-center justify-between gap-2 border-t border-line p-2 text-xs text-ink-soft">
        <span className="truncate">{address}</span>
        <a
          href={full}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-accent hover:underline"
        >
          Open map
        </a>
      </div>
    </div>
  );
}
