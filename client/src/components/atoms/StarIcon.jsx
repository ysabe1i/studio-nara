/**
 * StarIcon — atom. Decorative star for empty states. Takes its colour from
 * className (fill="currentColor"), not from a fixed hex.
 */
export default function StarIcon({ className = 'w-6 h-6 text-accent' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 1.5l2.95 8.2H23l-6.98 5.15L18.9 23 12 17.6 5.1 23l2.88-8.15L1 9.7h8.05z" />
    </svg>
  );
}
