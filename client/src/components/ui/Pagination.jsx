import { CaretLeft, CaretRight } from '@phosphor-icons/react';

// Prev / page numbers / next. Keeps at most 5 numbers visible around the current page.
export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const numbers = [];
  for (let i = start; i <= end; i += 1) numbers.push(i);

  const cell =
    'grid h-9 min-w-9 place-items-center rounded-sm border border-line px-2 text-sm ' +
    'disabled:opacity-40 disabled:pointer-events-none';

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        className={cell}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <CaretLeft size={14} />
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${cell} ${n === page ? 'border-accent bg-accent/10 text-accent' : 'hover:border-ink-soft'}`}
        >
          {n}
        </button>
      ))}
      <button
        className={cell}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <CaretRight size={14} />
      </button>
    </nav>
  );
}
