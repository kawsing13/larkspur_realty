import { StatusBadge } from '../property/StatusBadge.jsx';
import { formatDate } from '../../lib/format.js';

// The listing's status history, newest first.
export function StatusTimeline({ history = [] }) {
  if (history.length === 0) {
    return <p className="text-sm text-ink-soft">No activity yet.</p>;
  }

  return (
    <ol className="relative border-l border-line pl-5">
      {history.map((h) => (
        <li key={h.id} className="mb-5 last:mb-0">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border border-line bg-surface" />
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={h.toStatus} />
            <span className="text-xs text-ink-soft">
              {[h.by ? `by ${h.by}` : null, formatDate(h.at)].filter(Boolean).join(', ')}
            </span>
          </div>
          {h.note && <p className="mt-1 text-sm text-ink-soft">{h.note}</p>}
        </li>
      ))}
    </ol>
  );
}
