// Shown when a list has no results. An empty screen is an invitation to act, so
// pass an `action` (a Button) whenever there is a sensible next step.
export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded border border-dashed border-line px-6 py-14 text-center">
      {Icon && <Icon size={28} className="text-ink-soft" />}
      <h3 className="text-lg">{title}</h3>
      {children && <p className="max-w-sm text-sm text-ink-soft">{children}</p>}
      {action}
    </div>
  );
}
