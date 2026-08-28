import { forwardRef } from 'react';
import { Spinner } from './Spinner.jsx';

// The one button.
//   primary   - filled accent, the main action on a view
//   secondary - outlined, a secondary action
//   ghost     - text only, low emphasis
//   danger    - destructive action
//
// Pass `as={Link}` to render a react-router link that looks like a button.
// While `loading`, it shows a spinner and disables itself.

const base =
  'inline-flex items-center justify-center gap-2 rounded font-medium text-sm px-4 h-10 ' +
  'whitespace-nowrap transition-[transform,background-color,border-color,filter] duration-150 ' +
  'active:translate-y-px disabled:opacity-50 disabled:pointer-events-none ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const variants = {
  primary: 'bg-accent text-white shadow-sm hover:bg-accent-press hover:shadow',
  secondary: 'border border-line bg-surface text-ink hover:border-ink-soft',
  ghost: 'text-accent hover:bg-accent/10',
  danger: 'bg-danger text-white shadow-sm hover:brightness-95',
};

export const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', loading = false, disabled, className = '', children, ...props },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`${base} ${variants[variant]} ${className}`}
      disabled={Component === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {children}
    </Component>
  );
});
