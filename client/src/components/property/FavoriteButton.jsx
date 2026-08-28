import { useNavigate, useLocation } from 'react-router-dom';
import { Heart } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useFavorites } from '../../context/FavoritesContext.jsx';

// A heart toggle. Guests are sent to sign in; staff accounts do not see it at all.
export function FavoriteButton({ propertyId, size = 18, className = '' }) {
  const { user } = useAuth();
  const { isCustomer, isFavorite, toggle } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  // Staff have no favorites.
  if (user && !isCustomer) return null;

  const active = isFavorite(propertyId);

  const onClick = (e) => {
    // These buttons often sit inside a card that is itself a link.
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    toggle(propertyId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? 'Remove from saved' : 'Save this property'}
      className={`grid place-items-center rounded-full border border-line bg-surface/90 text-ink-soft transition-colors hover:border-ink-soft ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      <Heart size={size} weight={active ? 'fill' : 'regular'} className={active ? 'text-accent' : ''} />
    </button>
  );
}
