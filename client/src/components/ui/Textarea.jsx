import { forwardRef } from 'react';

export const Textarea = forwardRef(function Textarea({ className = '', rows = 5, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={
        'w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink ' +
        'placeholder:text-ink-soft/70 ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
        className
      }
      {...props}
    />
  );
});
