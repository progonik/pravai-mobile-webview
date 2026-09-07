import type { CSSProperties } from 'react'

/**
 * Loading placeholder. Callers give it the shape of whatever it stands in for,
 * so the skeleton occupies the same space as the real content and the layout
 * does not jump once data arrives.
 *
 * The sweep animation lives in `.skeleton` (src/index.css) — a travelling
 * highlight rather than a pulse, so a grid of them loads as one surface instead
 * of a dozen independently blinking boxes.
 */
export function Skeleton({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />
}

/** Mirrors ProductCard: image tile, bonus figure, two title lines, meta. */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-square rounded-2xl shrink-0" />
      <div className="px-1 pt-2.5 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-1/3 rounded-full" />
        <Skeleton className="h-3 w-11/12 rounded-full" />
        <Skeleton className="h-3 w-2/3 rounded-full" />
      </div>
    </div>
  )
}

/** Mirrors the home category cell in its horizontal rail: tile plus label. */
export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5 w-[74px] shrink-0">
      <Skeleton className="w-full aspect-square rounded-[20px]" />
      <Skeleton className="h-2.5 w-4/5 rounded-full" />
    </div>
  )
}
