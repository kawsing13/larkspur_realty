import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../ui/Spinner.jsx';

// Guards a route.
//   not signed in           -> /login?next=<path>
//   signed in, wrong role   -> a plain "no access" message
//   otherwise               -> renders children
export function ProtectedRoute({ roles, children }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return (
      <div className="mx-auto max-w-content px-4 py-20 text-center">
        <h1 className="text-2xl">This area is off limits</h1>
        <p className="mt-2 text-ink-soft">
          Your account does not have access to this part of the platform.
        </p>
      </div>
    );
  }

  return children;
}
