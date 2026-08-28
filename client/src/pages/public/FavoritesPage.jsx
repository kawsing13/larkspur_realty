import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react';
import { useApi } from '../../hooks/useApi.js';
import { useFavorites } from '../../context/FavoritesContext.jsx';
import { PropertyCard } from '../../components/property/PropertyCard.jsx';
import { PropertyCardSkeleton } from '../../components/property/PropertyCardSkeleton.jsx';
import { EmptyState, DataError, Button } from '../../components/ui/index.js';

export default function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const { data, loading, error, refetch } = useApi('/favorites');

  // Re-fetch when the saved set changes, so unsaving a card removes it here too.
  const key = [...favoriteIds].sort().join(',');
  useEffect(() => {
    refetch();
  }, [key, refetch]);

  return (
    <div className="mx-auto max-w-content px-4 py-10">
      <h1 className="text-2xl">Saved properties</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Listings you have saved. Tap the heart on any listing to add or remove it.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading && Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)}

        {!loading && error && (
          <div className="sm:col-span-2 lg:col-span-3">
            <DataError message={error} onRetry={refetch} />
          </div>
        )}

        {!loading && !error && data?.data.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState
              icon={Heart}
              title="No saved properties yet"
              action={
                <Button as={Link} to="/search">
                  Browse listings
                </Button>
              }
            >
              Save the ones you want to come back to, and they will show up here.
            </EmptyState>
          </div>
        )}

        {!loading &&
          !error &&
          data?.data.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </div>
  );
}
