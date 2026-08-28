import { ChatText, ArrowsClockwise, UserSwitch } from '@phosphor-icons/react';
import { formatDate } from '../../lib/format.js';

const ICON = {
  NOTE: ChatText,
  STATUS_CHANGE: ArrowsClockwise,
  ASSIGNMENT: UserSwitch,
};

// The lead's interaction history: agent notes plus automatic status / assignment
// entries, oldest first.
export function LeadTimeline({ items = [] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-soft">No activity yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {items.map((it) => {
        const Icon = ICON[it.kind] || ChatText;
        return (
          <li key={it.id} className="flex gap-3">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-ink-soft">
              <Icon size={14} />
            </span>
            <div className="min-w-0">
              <p className={`text-sm ${it.kind === 'NOTE' ? '' : 'text-ink-soft'}`}>{it.body}</p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {[it.by, formatDate(it.at)].filter(Boolean).join(' · ')}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
