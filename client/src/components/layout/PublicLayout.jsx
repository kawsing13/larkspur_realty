import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from './PublicHeader.jsx';
import { PublicFooter } from './PublicFooter.jsx';

export function PublicLayout() {
  const location = useLocation();
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <PublicHeader />
      <main className="flex-1">
        {/* keyed by path so the gentle enter animation replays on navigation */}
        <div key={location.pathname} className="route-enter">
          <Outlet />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
