/**
 * Copy text to the clipboard, reporting whether it landed.
 *
 * `navigator.clipboard` is undefined outside a secure context — a phone hitting
 * a dev server over http on a LAN address is the everyday case — so reading
 * `.writeText` off it throws a TypeError rather than rejecting. Callers were
 * doing `navigator.clipboard.writeText(x).catch(() => {})`, which does not
 * catch that: the throw happens while evaluating the expression, before there
 * is a promise to attach `.catch` to, so it took the whole handler down and the
 * button appeared dead.
 *
 * The execCommand path is the fallback for exactly that case. It is deprecated
 * and synchronous, but it is the only thing that works on an insecure origin.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Denied permission or a hostile embedding — try the legacy path.
    }
  }

  try {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    // The app sets `user-select: none` globally; a field that cannot be
    // selected cannot be copied from.
    field.style.userSelect = 'text'
    field.style.position = 'fixed'
    field.style.top = '-9999px'
    document.body.appendChild(field)
    field.select()
    field.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    document.body.removeChild(field)
    return ok
  } catch {
    return false
  }
}
