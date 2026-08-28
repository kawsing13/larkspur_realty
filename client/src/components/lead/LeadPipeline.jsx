import { Button } from '../ui/index.js';

// The lead lifecycle as a clickable stepper. The five working stages are chips;
// Won / Lost are the two outcomes.
const STAGES = [
  ['NEW', 'New'],
  ['CONTACTED', 'Contacted'],
  ['QUALIFIED', 'Qualified'],
  ['VIEWING_SCHEDULED', 'Viewing'],
  ['NEGOTIATION', 'Negotiation'],
];

export function LeadPipeline({ status, disabled, busy, onChange }) {
  const closed = status === 'WON' || status === 'LOST';
  const currentIndex = STAGES.findIndex(([s]) => s === status);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {STAGES.map(([value, label], i) => {
          const active = value === status;
          const done = !closed && currentIndex > i;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled || !!busy}
              onClick={() => onChange(value)}
              className={`rounded-sm border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                active
                  ? 'border-accent bg-accent text-white'
                  : done
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-line text-ink-soft hover:border-ink-soft'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          variant={status === 'WON' ? 'primary' : 'secondary'}
          disabled={disabled || !!busy}
          onClick={() => onChange('WON')}
        >
          Won
        </Button>
        <Button
          variant={status === 'LOST' ? 'danger' : 'secondary'}
          disabled={disabled || !!busy}
          onClick={() => onChange('LOST')}
        >
          Lost
        </Button>
      </div>
    </div>
  );
}
