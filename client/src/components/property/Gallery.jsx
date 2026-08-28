import { useState } from 'react';

// A plain image gallery: one large image plus a thumbnail strip. No carousel
// library, no autoplay.
export function Gallery({ images = [], title }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-[16/9] rounded border border-line bg-ink/5" />;
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded border border-line">
        <img
          src={current.url}
          alt={current.caption || title}
          className="aspect-[16/9] w-full object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-sm border ${
                i === active ? 'border-accent' : 'border-line'
              }`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
