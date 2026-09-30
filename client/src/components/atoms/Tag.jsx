/**
 * Tag — atom. Props: label, color ('accent' | 'primary').
 * Always paired with black text per the contrast rule in the design system.
 */
export default function Tag({ label, color = "accent" }) {
  const bg = color === "primary" ? "bg-primary" : "bg-accent";
  return (
    <span className={`${bg} text-black text-small font-semibold rounded-full px-3 py-1 inline-block`}>
      {label}
    </span>
  );
}
