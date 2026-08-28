// The Larkspur lockup: a small flowering-sprig glyph plus the wordmark in the
// display serif. `compact` drops the wordmark (for tight portal headers on mobile).
export function Logo({ compact = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="rgb(var(--accent))" />
        {/* a larkspur sprig: a stem with one open bloom and two flanking pairs */}
        <path d="M16 26V10.5" stroke="#fff" strokeWidth="2.25" strokeLinecap="round" />
        <circle cx="16" cy="8.5" r="2.8" fill="#fff" />
        <circle cx="11.4" cy="14" r="2.2" fill="#fff" fillOpacity="0.8" />
        <circle cx="20.6" cy="14" r="2.2" fill="#fff" fillOpacity="0.8" />
        <circle cx="12.4" cy="19.6" r="1.9" fill="#fff" fillOpacity="0.6" />
        <circle cx="19.6" cy="19.6" r="1.9" fill="#fff" fillOpacity="0.6" />
      </svg>
      {!compact && (
        <span className="font-display text-xl font-medium tracking-tight text-ink">
          Larkspur
        </span>
      )}
    </span>
  );
}
