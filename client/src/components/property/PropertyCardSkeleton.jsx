// Loading placeholder shaped like PropertyCard, so the grid does not jump when
// data arrives.
const bar = 'animate-pulse rounded bg-ink/5 motion-reduce:animate-none';

export function PropertyCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className={`aspect-[4/3] ${bar} rounded-none`} />
      <div className="flex flex-col gap-2 p-4">
        <div className={`h-5 w-28 ${bar}`} />
        <div className={`h-4 w-3/4 ${bar}`} />
        <div className={`h-3 w-1/2 ${bar}`} />
        <div className={`mt-2 h-3 w-2/3 ${bar}`} />
      </div>
    </div>
  );
}
