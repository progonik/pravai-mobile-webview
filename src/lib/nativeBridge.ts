/**
 * Bridge to the native app that hosts this web app in a WebView.
 *
 * Push notifications: once a native shell exists, it will subscribe to a
 * per-user topic (e.g. `user_{userId}`, for exam reminders) and has no way of
 * knowing who is signed in on its own -- the web app hands it the id on
 * login and takes it back on logout.
 *
 * The handlers live on `window.flutter_inappwebview`, matching the
 * `flutter_inappwebview` package's convention (the exact bridge object a
 * PravAI shell exposes may differ once one is built -- see CLAUDE.md's
 * backend-gap note). In a plain browser every call here is a no-op, and
 * callers fall back to their web behaviour.
 */

interface FlutterInAppWebView {
  callHandler: (handlerName: string, ...args: unknown[]) => Promise<unknown>
}

declare global {
  interface Window {
    flutter_inappwebview?: FlutterInAppWebView
  }
}

const READY_EVENT = 'flutterInAppWebViewPlatformReady'

/**
 * How long to wait for the readiness event before treating the host as a plain
 * browser. The shell fires it as soon as the page starts loading, so this is
 * only slack for a slow device — the wait is not cached (see below), and a
 * later call will look again.
 */
const READY_TIMEOUT = 5000

let readyPromise: Promise<FlutterInAppWebView | null> | null = null

/** The bridge as it stands right now, without waiting for the readiness event. */
const currentBridge = (): FlutterInAppWebView | null =>
  typeof window.flutter_inappwebview?.callHandler === 'function'
    ? window.flutter_inappwebview
    : null

/**
 * Resolve with the bridge once the shell reports it ready, or with null when
 * there is no shell.
 *
 * The readiness event fires once and early — usually before this module is
 * even parsed — so the object already being on `window` is the normal case,
 * and the listener only covers the race where it is not.
 */
function whenBridgeReady(): Promise<FlutterInAppWebView | null> {
  if (readyPromise) return readyPromise

  readyPromise = new Promise((resolve) => {
    const bridge = currentBridge()
    if (bridge) {
      resolve(bridge)
      return
    }

    const onReady = () => {
      window.clearTimeout(timer)
      resolve(currentBridge())
    }

    const timer = window.setTimeout(() => {
      window.removeEventListener(READY_EVENT, onReady)
      // Don't cache the miss: a browser will simply time out again, while a
      // shell that was merely slow gets picked up by the next call.
      readyPromise = null
      resolve(null)
    }, READY_TIMEOUT)

    window.addEventListener(READY_EVENT, onReady, { once: true })
  })

  return readyPromise
}

/** Call a native handler once the bridge is ready; silently skip if there is none. */
async function callNative(handlerName: string, ...args: unknown[]): Promise<void> {
  const bridge = await whenBridgeReady()
  if (!bridge) return

  try {
    await bridge.callHandler(handlerName, ...args)
  } catch (err) {
    // A failed bridge call must not take the surrounding action down with it.
    console.warn(`[native] ${handlerName} failed`, err)
  }
}

/** Subscribe the device to this user's notification topic after sign-in. */
export const subscribeToNotifications = (userId: string): Promise<void> =>
  userId ? callNative('notification.subscribe', { userId }) : Promise.resolve()

/** Unsubscribe the device before the session is dropped. */
export const unsubscribeFromNotifications = (userId: string): Promise<void> =>
  userId ? callNative('notification.unsubscribe', { userId }) : Promise.resolve()

/** True when this page is running inside the native shell rather than a browser. */
export const isNativeShell = (): boolean => currentBridge() !== null
