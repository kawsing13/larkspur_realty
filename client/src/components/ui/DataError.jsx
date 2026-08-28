import { Button } from './Button.jsx';

// Inline error block for a failed data load. Says what happened and offers a retry.
export function DataError({ message = 'We could not load this right now', onRetry }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded border border-line bg-surface p-4">
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
