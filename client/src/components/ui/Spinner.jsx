// A quiet loading indicator. The spin animation is dropped under reduced motion.
export function Spinner({ size = 20, className = '' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
