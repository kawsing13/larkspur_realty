// Tracks which properties the signed-in customer has saved, so the heart shows the
// right state everywhere without each card fetching on its own.
//
// Only customer accounts have favorites. For guests and staff, the set stays empty
// and `toggle` sends guests to sign in.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../lib/apiClient.js';
import { useAuth } from './AuthContext.jsx';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const isCustomer = !!user && user.roles.includes('CUSTOMER');
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!isCustomer) {
      setIds(new Set());
      return;
    }
    let cancelled = false;
    api
      .get('/favorites/ids')
      .then((res) => {
        if (!cancelled) setIds(new Set(res.data.propertyIds));
      })
      .catch(() => {
        /* leave the set empty on failure */
      });
    return () => {
      cancelled = true;
    };
  }, [isCustomer]);

  const isFavorite = useCallback((propertyId) => ids.has(propertyId), [ids]);

  const toggle = useCallback(
    async (propertyId) => {
      const wasSaved = ids.has(propertyId);

      // Update the UI immediately, then reconcile with the server.
      setIds((cur) => {
        const next = new Set(cur);
        if (wasSaved) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });

      try {
        if (wasSaved) await api.delete(`/favorites/${propertyId}`);
        else await api.post('/favorites', { propertyId });
      } catch {
        // Roll back if the request failed.
        setIds((cur) => {
          const next = new Set(cur);
          if (wasSaved) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      }
    },
    [ids],
  );

  return (
    <FavoritesContext.Provider value={{ isCustomer, favoriteIds: ids, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside <FavoritesProvider>');
  return ctx;
};
