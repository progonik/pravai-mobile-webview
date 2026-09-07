import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Heart, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'liked' | 'unliked'

interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

/** How long a toast stays up. Long enough to read, short enough to ignore. */
const TOAST_MS = 1900

/** Most toasts stand alone; a small cap stops a rapid tap run stacking up. */
const MAX_VISIBLE = 3

const ToastContext = createContext<{ showToast: (message: string, variant?: ToastVariant) => void }>({
  showToast: () => {},
})

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <Check size={14} strokeWidth={3} />,
  error: <X size={14} strokeWidth={3} />,
  liked: <Heart size={13} fill="currentColor" />,
  unliked: <Heart size={13} />,
}

const ICON_STYLES: Record<ToastVariant, string> = {
  success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
  error: 'bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400',
  liked: 'bg-red-100 text-red-500 dark:bg-red-500/15 dark:text-red-400',
  unliked: 'bg-input-background text-muted-foreground',
}

/**
 * Transient confirmations, shown as a pill at the top of the screen.
 *
 * For actions whose only other feedback is a small state change — the like
 * heart filling in, say — where it is easy to miss whether the tap registered
 * at all.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId.current++
    setToasts((prev) => [...prev, { id, message, variant }].slice(-MAX_VISIBLE))
    timers.current.push(
      window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_MS),
    )
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Above every sheet and modal, and clear of the status bar.
          pointer-events-none so a toast never eats a tap meant for the page. */}
      <div
        className="fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none"
        style={{ paddingTop: 'calc(var(--safe-top) + 10px)' }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="animate-toast-in flex items-center gap-2.5 max-w-full bg-card rounded-2xl border border-border pl-2 pr-4 py-2"
            style={{ boxShadow: '0 8px 28px rgba(0,0,0,0.14)' }}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ICON_STYLES[toast.variant]}`}>
              {ICONS[toast.variant]}
            </div>
            <span className="text-[13px] font-semibold text-foreground truncate">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
