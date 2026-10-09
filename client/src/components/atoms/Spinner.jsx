/**
 * Spinner — atom. A loading ring: magenta in light mode, lime in dark mode
 * (border-t-accent only takes effect once the "dark" class is on <html>).
 */
export default function Spinner({ size = 24, className = '' }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={`inline-block rounded-full border-2 border-ink/15 border-t-primary dark:border-t-accent animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
