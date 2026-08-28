import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';

// A minimal centered dialog. Closes on Escape or a click on the backdrop.
// `footer` is where the action buttons go.
export function Modal({ open, onClose, title, children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{ backgroundColor: 'rgba(15, 20, 18, 0.55)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded border border-line bg-surface p-5 shadow-lg outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="mt-3 text-sm text-ink-soft">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
