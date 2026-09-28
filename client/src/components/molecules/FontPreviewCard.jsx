import { useEffect, useState } from "react";
import useFileUrl from "../../hooks/useFileUrl.js";

/**
 * FontPreviewCard — molecule. Props: fontFamilyName, fileUrl, onRemove.
 *
 * This is the one piece flagged as a real risk in the proposal: getting an
 * uploaded font file to actually render as live preview text. It uses the
 * native FontFace API — load the font from the object URL created when the
 * file was uploaded, register it on the document, then render the sample
 * text with that family name once it's ready.
 */
export default function FontPreviewCard({ fontFamilyName, fileUrl, onRemove }) {
  const [status, setStatus] = useState(fileUrl ? "loading" : "idle");
  const resolvedUrl = useFileUrl(fileUrl);

  useEffect(() => {
    if (!resolvedUrl) return;
    let cancelled = false;

    const face = new FontFace(fontFamilyName, `url(${resolvedUrl})`);
    face
      .load()
      .then((loadedFace) => {
        if (cancelled) return;
        document.fonts.add(loadedFace);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedUrl, fontFamilyName]);

  return (
    <div className="flex items-center gap-3 bg-surface rounded-lg px-3 py-2">
      <div className="flex-1 min-w-0">
        <p
          className="text-lg truncate"
          style={status === "ready" ? { fontFamily: fontFamilyName } : undefined}
        >
          Aa — {fontFamilyName || "Sample text"}
        </p>
        {status === "loading" && <p className="text-small text-ink/50">loading preview…</p>}
        {status === "error" && <p className="text-small text-primary">couldn't load this font file</p>}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${fontFamilyName || "font"}`}
        className="text-ink/50 hover:text-ink shrink-0"
      >
        ×
      </button>
    </div>
  );
}
