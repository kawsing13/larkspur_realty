// A row of small figures summarising an agent's listing activity.
const CELLS = [
  ['Total', 'total'],
  ['Published', 'published'],
  ['In review', 'inReview'],
  ['Drafts', 'draft'],
  ['Closed', 'closed'],
];

export function AgentPerformance({ performance }) {
  if (!performance) return null;
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-line bg-line sm:grid-cols-5">
      {CELLS.map(([label, key]) => (
        <div key={key} className="bg-surface px-3 py-3 text-center">
          <dd className="font-mono text-xl">{performance[key] ?? 0}</dd>
          <dt className="mt-0.5 text-[11px] text-ink-soft">{label}</dt>
        </div>
      ))}
    </dl>
  );
}
