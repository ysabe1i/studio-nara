import useFileUrl from "../../hooks/useFileUrl.js";

/**
 * Card — molecule. Props: title, subtitle, onClick, and either `thumbnail`
 * (an image URL, used by project cards) or `preview` (a custom node, used by
 * kit cards for the palette/logo/font preview — see KitPreview). `preview`
 * takes priority if both are given.
 */
export default function Card({ title, subtitle, thumbnail, preview, onClick }) {
  const thumbnailUrl = useFileUrl(thumbnail);
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-surface rounded-2xl p-4 hover:-translate-y-0.5 transition-transform w-full"
    >
      <div className="aspect-video bg-canvas border border-dashed border-ink/20 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {preview ? (
          preview
        ) : thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-ink/30 text-small">no image</span>
        )}
      </div>
      <p className="font-medium text-body truncate">{title}</p>
      {subtitle && <p className="text-small text-ink/60 truncate">{subtitle}</p>}
    </button>
  );
}
