import { useState } from 'react';
import { SlidersHorizontal, X } from '@phosphor-icons/react';
import { Input, Select } from '../ui/index.js';

const BED_OPTIONS = [
  ['', 'Any beds'],
  ['1', '1+ beds'],
  ['2', '2+ beds'],
  ['3', '3+ beds'],
  ['4', '4+ beds'],
  ['5', '5+ beds'],
];
const BATH_OPTIONS = [
  ['', 'Any baths'],
  ['1', '1+ baths'],
  ['2', '2+ baths'],
  ['3', '3+ baths'],
];
const SORT_OPTIONS = [
  ['newest', 'Newest'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['beds_desc', 'Most bedrooms'],
  ['area_desc', 'Largest'],
];

const PRIMARY_KEYS = [
  'q',
  'listingMode',
  'propertyType',
  'city',
  'minPrice',
  'maxPrice',
  'minBeds',
  'minBaths',
];

// The filter controls. It reads from and writes to the URL query (via props from
// the page), so a filtered view is always a shareable link.
export function SearchFilters({ params, setParam, onReset, types = [], amenities = [], facets }) {
  const [showMore, setShowMore] = useState(false);
  const get = (key) => params.get(key) || '';

  const selectedAmenities = new Set(get('amenities').split(',').filter(Boolean));
  const toggleAmenity = (slug) => {
    const next = new Set(selectedAmenities);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setParam('amenities', [...next].join(','));
  };

  const activeCount = PRIMARY_KEYS.filter((k) => get(k)).length + selectedAmenities.size;

  return (
    <div className="rounded border border-line bg-surface p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="City, neighborhood, or reference"
          value={get('q')}
          onChange={(e) => setParam('q', e.target.value)}
          aria-label="Keyword"
        />
        <Select
          value={get('listingMode')}
          onChange={(e) => setParam('listingMode', e.target.value)}
          aria-label="Sale or rent"
        >
          <option value="">Sale and rent</option>
          <option value="SALE">For sale</option>
          <option value="RENT">For rent</option>
        </Select>
        <Select
          value={get('propertyType')}
          onChange={(e) => setParam('propertyType', e.target.value)}
          aria-label="Property type"
        >
          <option value="">Any type</option>
          {types.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select
          value={get('city')}
          onChange={(e) => setParam('city', e.target.value)}
          aria-label="City"
        >
          <option value="">Any city</option>
          {(facets?.cities || []).map((c) => (
            <option key={c.city} value={c.city}>
              {c.city}
              {c.state ? `, ${c.state}` : ''}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Input
          type="number"
          min="0"
          placeholder="Min price"
          value={get('minPrice')}
          onChange={(e) => setParam('minPrice', e.target.value)}
          aria-label="Minimum price"
        />
        <Input
          type="number"
          min="0"
          placeholder="Max price"
          value={get('maxPrice')}
          onChange={(e) => setParam('maxPrice', e.target.value)}
          aria-label="Maximum price"
        />
        <Select
          value={get('minBeds')}
          onChange={(e) => setParam('minBeds', e.target.value)}
          aria-label="Bedrooms"
        >
          {BED_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
        <Select
          value={get('sort') || 'newest'}
          onChange={(e) => setParam('sort', e.target.value)}
          aria-label="Sort order"
        >
          {SORT_OPTIONS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="flex items-center gap-1.5 text-sm text-accent hover:underline"
        >
          <SlidersHorizontal size={14} />
          {showMore ? 'Fewer filters' : 'More filters'}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
          >
            <X size={13} /> Clear filters
          </button>
        )}
      </div>

      {showMore && (
        <div className="mt-4 border-t border-line pt-4">
          <label className="flex max-w-[200px] flex-col gap-1 text-sm">
            <span className="font-medium">Bathrooms</span>
            <Select value={get('minBaths')} onChange={(e) => setParam('minBaths', e.target.value)}>
              {BATH_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </label>

          {amenities.length > 0 && (
            <fieldset className="mt-4">
              <legend className="text-sm font-medium">Amenities</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenities.map((a) => {
                  const on = selectedAmenities.has(a.slug);
                  return (
                    <button
                      key={a.slug}
                      type="button"
                      onClick={() => toggleAmenity(a.slug)}
                      aria-pressed={on}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        on
                          ? 'border-accent bg-accent/10 text-accent'
                          : 'border-line text-ink-soft hover:border-ink-soft'
                      }`}
                    >
                      {a.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
        </div>
      )}
    </div>
  );
}
