import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

/**
 * Staleness tiers.
 *
 * Everything defaults to `live`. A cached response still paints immediately —
 * that is what `gcTime` is for — but it is considered stale the moment it
 * lands, so remounting a screen fires a background refetch and swaps in fresh
 * data without ever showing a spinner. Re-opening a product, a wallet or an
 * order list therefore always ends up current.
 *
 * A non-zero `staleTime` is the opposite promise: "do not ask again for N
 * seconds". Only give it to lists that genuinely cannot change while the app
 * is open.
 */
export const STALE_TIME = {
  /** Account data, single products, anything the backend can change under us. */
  live: 0,
  /**
   * Paginated catalog feeds. Refetching an infinite query re-runs *every* page
   * it has loaded, so a `live` feed costs one request per scrolled page on
   * every return to the screen. A minute's grace makes going back and forth
   * between a list and a product free, and still refreshes on any real visit.
   * Not for the notification feed — the bell promises that one is current.
   */
  feed: 60_000,
  /** Reference lists — regions, legal documents, FAQ. */
  reference: 30 * 60_000,
} as const

/**
 * How long an unmounted query survives in cache. Long, deliberately: it is what
 * makes going back to a screen paint instantly instead of flashing a skeleton,
 * while the background refetch above keeps that instant paint honest.
 */
const GC_TIME = 30 * 60_000

const MAX_RETRIES = 2

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  const status = isAxiosError(error) ? error.response?.status : undefined
  // A 4xx is a verdict on the request itself — a dead token, a record that is
  // not there. Repeating it changes nothing and only delays the error state.
  // The token refresh + 401 handling in `request.ts` already owns that case.
  if (status !== undefined && status >= 400 && status < 500) return false
  return failureCount < MAX_RETRIES
}

/**
 * The app-wide cache. Exported as a module singleton rather than built inside
 * `App` so non-React code (the forced logout after a 401) can reach it too.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME.live,
      gcTime: GC_TIME,
      // Stale on mount → refetch on mount. Cached data is shown while it runs.
      refetchOnMount: true,
      // The webview is backgrounded whenever the user leaves the app; coming
      // back is exactly when the data on screen is most likely to be old.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: shouldRetry,
    },
    mutations: {
      // Retrying a write risks doing it twice — the caller decides.
      retry: 0,
    },
  },
})

/**
 * Drop every cached response, in-flight request and mutation.
 *
 * Called when the signed-in user changes. Query keys are not user-scoped —
 * `['profile']` means "the profile of whoever is signed in" — so without this
 * the next account renders the previous one's data straight out of cache.
 * In-flight requests are cancelled first: they were issued with the old token
 * and their responses would otherwise land in the cache after it was emptied.
 */
export const resetQueryCache = (): void => {
  void queryClient.cancelQueries()
  queryClient.clear()
}
