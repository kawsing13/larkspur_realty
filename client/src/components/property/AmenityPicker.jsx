import { useState } from 'react';
import { Button } from '../ui/index.js';

// Checkboxes grouped by category. `all` is GET /api/amenities; `selected` is the
// property's current amenity objects. Saving replaces the whole set.
export function AmenityPicker({ all = [], selected = [], onSave, saving, error }) {
  const [chosen, setChosen] = useState(() => new Set(selected.map((a) => a.slug)));

  const toggle = (slug) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const groups = all.reduce((acc, a) => {
    const key = a.category || 'Other';
    (acc[key] ||= []).push(a);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <p
          className="rounded-sm border border-danger/30 bg-danger/5 p-2 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {Object.entries(groups).map(([category, items]) => (
        <fieldset key={category}>
          <legend className="text-sm font-medium">{category}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {items.map((a) => (
              <label key={a.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={chosen.has(a.slug)}
                  onChange={() => toggle(a.slug)}
                  className="h-4 w-4 accent-accent"
                />
                {a.name}
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <div>
        <Button onClick={() => onSave([...chosen])} loading={saving}>
          Save amenities
        </Button>
      </div>
    </div>
  );
}
