import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, WarningCircle, Info, X } from '@phosphor-icons/react';

// Lightweight toast notifications. Use for transient feedback only ("Saved",
// "Could not save"); anything the user must act on belongs inline in the page.
//
//   const toast = useToast();
//   toast.success('Listing published');
//   toast.error('That did not work');

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = nextId++;
      setToasts((list) => [...list, { id, message, type }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = {
    notify,
    success: (m) => notify(m, 'success'),
    error: (m) => notify(m, 'error', 6000),
    info: (m) => notify(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const ICONS = { success: CheckCircle, error: WarningCircle, info: Info };

function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || Info;
  const tone =
    toast.type === 'error' ? 'text-danger' : toast.type === 'success' ? 'text-accent' : 'text-ink-soft';

  return (
    <div className="pointer-events-auto flex items-start gap-3 rounded border border-line bg-surface p-3 shadow-sm">
      <Icon size={20} weight="fill" className={tone} />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={onDismiss} aria-label="Dismiss" className="text-ink-soft hover:text-ink">
        <X size={16} />
      </button>
    </div>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};
