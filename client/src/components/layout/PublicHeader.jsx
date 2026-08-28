import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { Logo } from './Logo.jsx';

// One nav link. Full header height so the active underline sits on the header's
// bottom edge like a tab; it slides in (scale-x) and is skipped under reduced motion.
function NavItem({ to, active, children }) {
  return (
    <Link
      to={to}
      aria-current={active ? 'page' : undefined}
      className={
        'relative flex h-16 items-center text-sm transition-colors ' +
        'after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:rounded-full ' +
        'after:bg-accent after:transition-transform after:duration-200 motion-reduce:after:transition-none ' +
        (active
          ? 'font-medium text-ink after:scale-x-100'
          : 'text-ink-soft hover:text-ink after:scale-x-0')
      }
    >
      {children}
    </Link>
  );
}

export function PublicHeader() {
  const { user, hasRole, logout } = useAuth();
  const { pathname, search } = useLocation();

  const portalPath = hasRole('ADMINISTRATOR', 'SUPER_ADMIN')
    ? '/admin'
    : hasRole('AGENT', 'PROPERTY_MANAGER')
      ? '/agent'
      : null;

  // Buy vs Rent share the /search path and differ only by the listingMode query,
  // so NavLink (pathname-only) can't tell them apart - decide it here.
  const onSearch = pathname === '/search';
  const listingMode = new URLSearchParams(search).get('listingMode');
  const isBuy = onSearch && listingMode !== 'RENT';
  const isRent = onSearch && listingMode === 'RENT';
  const onPath = (base) => pathname === base || pathname.startsWith(`${base}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content items-center gap-7 px-4">
        <Link to="/" aria-label="Larkspur home">
          <Logo />
        </Link>

        <nav className="hidden h-full items-center gap-5 md:flex">
          <NavItem to="/search" active={isBuy}>
            Buy
          </NavItem>
          <NavItem to="/search?listingMode=RENT" active={isRent}>
            Rent
          </NavItem>
          {hasRole('CUSTOMER') && (
            <>
              <NavItem to="/favorites" active={onPath('/favorites')}>
                Saved
              </NavItem>
              <NavItem to="/saved-searches" active={onPath('/saved-searches')}>
                Searches
              </NavItem>
              <NavItem to="/my-viewings" active={onPath('/my-viewings')}>
                Viewings
              </NavItem>
              <NavItem to="/my-inquiries" active={onPath('/my-inquiries')}>
                Inquiries
              </NavItem>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {user && <NotificationBell />}
          <ThemeToggle />
          {user ? (
            <>
              {portalPath && (
                <Button as={Link} to={portalPath} variant="secondary">
                  Portal
                </Button>
              )}
              <Button variant="ghost" onClick={logout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost">
                Sign in
              </Button>
              <Button as={Link} to="/register" variant="primary">
                Create account
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
