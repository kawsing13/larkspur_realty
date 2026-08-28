import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ className = '', invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={
        'h-10 w-full rounded-sm border bg-surface px-3 text-sm text-ink ' +
        'placeholder:text-ink-soft/70 ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
        (invalid ? 'border-danger ' : 'border-line ') +
        className
      }
      {...props}
    />
  );
});
