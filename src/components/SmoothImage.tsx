import { useCallback, useState } from 'react'

interface SmoothImageProps {
  src: string
  alt?: string
  /** Classes for the image itself — sizing and `object-*` live here. */
  className?: string
  draggable?: boolean
  loading?: 'lazy' | 'eager'
}

/**
 * An image that arrives instead of appearing.
 *
 * Product and category artwork comes from the gateway at full size over a
 * mobile connection, so a plain `<img>` pops in — a grid of holes filling one
 * by one. This holds a shimmering placeholder until the bitmap is decoded,
 * then resolves it: the picture fades up out of a blur and settles from a
 * slight overscale, the way a photo comes into focus.
 *
 * There is no server-side thumbnail to blur up from, so the blur is applied to
 * the real image on its way in rather than to a low-quality stand-in.
 *
 * Keyed by `src`, so a new source remounts with clean state and replays the
 * entry rather than cross-fading into the previous picture.
 */
export function SmoothImage(props: SmoothImageProps) {
  return <SmoothImageFrame key={props.src} {...props} />
}

function SmoothImageFrame({ src, alt = '', className = '', draggable = false, loading = 'lazy' }: SmoothImageProps) {
  const [loaded, setLoaded] = useState(false)
  // A cached image is already decoded before React can attach `onLoad`, which
  // would leave it blurred forever. The callback ref catches that on mount and
  // shows it at once — with no transition, since there is nothing to animate.
  const [instant, setInstant] = useState(false)

  const measure = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth > 0) {
      setInstant(true)
      setLoaded(true)
    }
  }, [])

  return (
    <>
      {/* Sits behind the image rather than replacing it, so the layout never
          reflows as the picture lands. */}
      {!loaded && <div className="skeleton absolute inset-0" aria-hidden />}
      <img
        ref={measure}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={draggable}
        onLoad={() => setLoaded(true)}
        // A broken image must not sit under a shimmer forever.
        onError={() => { setInstant(true); setLoaded(true) }}
        className={`${className} ${instant ? '' : 'transition-[opacity,filter,transform] duration-500 ease-out'} ${
          loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-lg scale-[1.06]'
        }`}
      />
    </>
  )
}
