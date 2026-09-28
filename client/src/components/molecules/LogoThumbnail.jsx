import useFileUrl from "../../hooks/useFileUrl.js";

/**
 * LogoThumbnail — molecule. Props: src, label, onRemove.
 * Repeats inside LogoSection on the Brand kit builder screen.
 */
export default function LogoThumbnail({ src, label, onRemove }) {
  const imageUrl = useFileUrl(src);
  return (
    <div className="flex items-center gap-3 bg-surface rounded-lg px-3 py-2">
      <div className="w-10 h-10 rounded border border-dashed border-ink/20 flex items-center justify-center overflow-hidden shrink-0 bg-canvas">
        {imageUrl ? (
          <img src={imageUrl} alt={label ? `${label} logo` : "Uploaded logo"} className="w-full h-full object-contain" />
        ) : (
          <span className="text-ink/30 text-small">logo</span>
        )}
      </div>
      <span className="flex-1 text-body truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label || "logo"}`}
        className="text-ink/50 hover:text-ink shrink-0"
      >
        ×
      </button>
    </div>
  );
}
