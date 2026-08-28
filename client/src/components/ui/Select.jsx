import { forwardRef } from 'react';

export const Select = forwardRef(function Select({ className = '', children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={
        'h-10 w-full rounded-sm border border-line bg-surface px-2.5 text-sm text-ink ' +
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ' +
        className
      }
      {...props}
    >
      {children}
    </select>
  );
});
