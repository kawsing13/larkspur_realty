import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../ui/Button.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { Logo } from './Logo.jsx';

// Shared shell for the agent and admin portals. `nav` is an array of
// { to, label, icon, end? } passed in per portal from AppRoutes.
export function PortalLayout({ title, nav }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="border-b border-line bg-surface">
        <div className="flex h-16 items-center gap-3 px-4">
          <Link to="/" aria-label="Larkspur home">
            <Logo />
          </Link>
          <span className="border-l border-line pl-3 text-sm text-ink-soft">{title}</span>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <ThemeToggle />
            <span className="hidden text-sm text-ink-soft sm:inline">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="ghost" onClick={logout}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-content flex-1 flex-col gap-8 px-4 py-8 md:flex-row">
        <aside className="md:w-48 md:shrink-0">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent/10 font-medium text-accent'
                      : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      size={18}
                      weight={isActive ? 'fill' : 'regular'}
                      className="shrink-0"
                    />
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div key={location.pathname} className="route-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
