import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MagnifyingGlass, ShieldCheck, SealCheck, CalendarCheck } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { PropertyCard } from '../../components/property/PropertyCard.jsx';
import { PropertyCardSkeleton } from '../../components/property/PropertyCardSkeleton.jsx';
import { Button, Input, DataError } from '../../components/ui/index.js';

const TRUST = [
  { icon: ShieldCheck, label: 'Every listing checked' },
  { icon: SealCheck, label: 'Verified agents' },
  { icon: CalendarCheck, label: 'Same-week viewings' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('BUY'); // BUY | RENT
  const { data, loading, error, refetch } = useApi('/search?pageSize=6&sort=newest');

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const q = query.trim();
    if (q) params.set('q', q);
    if (mode === 'RENT') params.set('listingMode', 'RENT');
    const qs = params.toString();
    navigate(qs ? `/search?${qs}` : '/search');
  };

  return (
    <>
      {/* Hero: the search is the point of the page. Warm stone ground, a real
          photograph, the headline set in the display serif. */}
      <section className="border-b border-line bg-paper-2">
        <div className="mx-auto grid max-w-content items-center gap-10 px-4 py-14 md:grid-cols-[1.05fr_0.95fr] md:py-20">
          <div className="flex flex-col">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Larkspur Realty
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl">A brighter way to find your next place.</h1>
            <p className="mt-4 max-w-md text-lg text-ink-soft">
              Every home on Larkspur is checked by our team before it goes live. The agent, the
              paperwork, and a viewing slot are all one message away.
            </p>

            <form
              onSubmit={submit}
              className="mt-7 rounded-lg border border-line bg-surface p-2 warm-shadow"
            >
              <div className="mb-2 inline-flex rounded-md bg-paper-2 p-1 text-sm">
                {['BUY', 'RENT'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-pressed={mode === m}
                    className={`rounded-[8px] px-4 py-1.5 font-medium transition-colors ${
                      mode === m ? 'bg-surface text-ink warm-shadow' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {m === 'BUY' ? 'Buy' : 'Rent'}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="City, neighborhood, or reference number"
                  aria-label="Search listings"
                  className="h-11 border-0 focus-visible:outline-0"
                />
                <Button type="submit" className="h-11 shrink-0 px-5">
                  <MagnifyingGlass size={18} weight="bold" />
                  Search
                </Button>
              </div>
            </form>

            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-1.5">
                  <Icon size={16} weight="fill" className="text-accent" />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-line warm-shadow-lg">
              <img
                src="https://picsum.photos/seed/larkspur-hero/1100/1000"
                alt="A row of houses on a tree-lined street"
                className="h-64 w-full object-cover sm:h-80 md:h-[460px]"
              />
            </div>
            <div className="absolute bottom-4 left-4 rounded-lg border border-line bg-surface/95 px-4 py-2.5 backdrop-blur warm-shadow">
              <p className="font-display text-2xl leading-none text-ink">1,200+</p>
              <p className="mt-1 text-xs text-ink-soft">homes along the coast</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl">Just listed</h2>
            <p className="mt-1 text-sm text-ink-soft">The newest homes to come through review.</p>
          </div>
          <Link to="/search" className="shrink-0 text-sm text-accent hover:underline">
            See all listings
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading && Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}

          {!loading && error && (
            <div className="sm:col-span-2 lg:col-span-3">
              <DataError message={error} onRetry={refetch} />
            </div>
          )}

          {!loading &&
            !error &&
            data?.data.map((property) => <PropertyCard key={property.id} property={property} />)}
        </div>
      </section>
    </>
  );
}
