export type DesignIconName = 'car' | 'tests' | 'book' | 'brain' | 'target' | 'pin' | 'star' | 'chart' | 'turn' | 'crossroad' | 'warning' | 'speed' | 'home' | 'checklist' | 'profile' | 'chat' | 'bell' | 'flame' | 'gift' | 'check' | 'tutor'

/** Standalone SVG assets are also available in public/icons for native clients. */
export function DesignIcon({ name, size = 32, className = '' }: { name: DesignIconName; size?: number; className?: string }) {
  return <img src={`/icons/${name}.svg`} data-icon={name} width={size} height={size} className={`design-icon ${className}`} alt="" aria-hidden="true" />
}
