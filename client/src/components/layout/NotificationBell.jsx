import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from '@phosphor-icons/react';
import { api } from '../../lib/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatDateTime } from '../../lib/format.js';

export function NotificationBell() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({ data: [], unreadCount: 0 });
  const ref = useRef(null);

  const load = useCallback(() => {
    api
      .get('/notifications')
      .then((r) => setState(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    load();
    const timer = setInterval(load, 60000); // light polling
    return () => clearInterval(timer);
  }, [user, load]);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  const portalBase = hasRole('ADMINISTRATOR', 'SUPER_ADMIN') ? '/admin' : '/agent';
  const isStaff = hasRole('AGENT', 'PROPERTY_MANAGER', 'ADMINISTRATOR', 'SUPER_ADMIN');

  const openNotification = async (n) => {
    if (!n.readAt) {
      await api.post(`/notifications/${n.id}/read`).catch(() => {});
      load();
    }
    setOpen(false);
    const d = n.data || {};
    if (d.inquiryId && isStaff) navigate(`${portalBase}/leads/${d.inquiryId}`);
    else if (d.appointmentId && isStaff) navigate(`${portalBase}/appointments/${d.appointmentId}`);
    else if (d.propertyId) navigate(`/listings/${d.propertyId}`);
  };

  const markAll = async () => {
    await api.post('/notifications/read-all').catch(() => {});
    load();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative grid h-8 w-8 place-items-center rounded-sm text-ink-soft hover:text-ink"
      >
        <Bell size={18} weight={state.unreadCount > 0 ? 'fill' : 'regular'} />
        {state.unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-white">
            {state.unreadCount > 9 ? '9+' : state.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded border border-line bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <span className="text-sm font-medium">Notifications</span>
            {state.unreadCount > 0 && (
              <button onClick={markAll} className="text-xs text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {state.data.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-ink-soft">Nothing yet.</li>
            )}
            {state.data.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => openNotification(n)}
                  className={`block w-full border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-ink/[0.02] ${
                    n.readAt ? '' : 'bg-accent/[0.04]'
                  }`}
                >
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-ink-soft">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-ink-soft">{formatDateTime(n.createdAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
