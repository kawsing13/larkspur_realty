// Small status label. `tone` maps to a color; keep the set short so a page
// stays calm and one accent reads as "the" accent.
const tones = {
  neutral: 'bg-ink/[0.06] text-ink-soft',
  accent: 'bg-accent/10 text-accent',
  gold: 'bg-gold/12 text-gold',
  danger: 'bg-danger/10 text-danger',
};

export function Badge({ tone = 'neutral', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
