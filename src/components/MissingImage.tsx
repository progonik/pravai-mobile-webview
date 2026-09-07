import { ImageOff } from 'lucide-react'

/**
 * Stands in wherever the backend has no image for a record — one placeholder
 * for every case, deliberately reading as "nothing was uploaded" rather than as
 * artwork. Anything that resembles a real photo or a meaningful icon hides the
 * gap from whoever maintains the catalog, so this stays plain and repetitive on
 * purpose.
 *
 * Fills its parent; the parent owns the size and any rounding.
 */
export function MissingImage({ size = 22, label }: { size?: number; label?: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground/60">
      <ImageOff size={size} strokeWidth={1.75} />
      {label && <span className="text-[9px] font-medium uppercase tracking-wide">{label}</span>}
    </div>
  )
}
