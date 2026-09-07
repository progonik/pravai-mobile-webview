# PravAI Mobile WebView — conventions

React 19 + TypeScript + Vite, Tailwind v4, React Query, react-router v7 (HashRouter).
Meant to run inside a native iOS/Android WebView shell; `src/lib/nativeBridge.ts` is
the boundary to it (no shell exists yet -- see "Status" below).

This project was scaffolded from `progress-master-app` (a sibling product's
mobile webview, same architecture) by stripping its e-commerce domain,
rewiring auth to PravAI's own backend, and re-skinning the whole design layer
to PravAI's own look (see `design/pravai.html` in the main `pravai` repo) —
Progress's soft blue/gradient palette is gone. The **app mechanics** (press
states, screen transitions, scroll memory, the tabbar's measurement/render
split, safe-area handling) are carried over unchanged on purpose: they're
solved interaction problems, not decisions specific to either product's
branding.

## Status (read this before adding a screen)

**Real and working, verified against the live API (`pravai-api.ai-bek.com`):**
phone+OTP sign-in (auto-registers a new phone, no separate register/profile
step), session persistence + silent refresh-on-401, `GET/PATCH /users/me`,
`PATCH /users/me/language`, avatar upload, the language switcher (with
backend sync), tab navigation, scroll memory, the welcome screen.

**Placeholder only** (`HomePage`, `TestsPage`, `QuizPage`, `ResultPage`,
`ChatPage` all render a "coming soon" card): these need backend work first.
Specifically, the backend currently only exposes:
- `POST /exam/attempts` (start/resume) and `POST /exam/attempts/:id/answer` --
  no way to *list* available test templates/topics/license categories from a
  non-admin token yet. The admin-panel equivalents exist under
  `/api/v1/admin/*` but require an admin role.
- No chat/explanation endpoint exists for the AI-tutor screen at all.

Do not wire a screen to admin endpoints as a workaround -- add the missing
mobile-facing endpoint on the backend (`pravai` repo) instead.

## Design primitives

Everything below is defined once in `src/index.css`, ported from
`design/pravai.html` in the main `pravai` repo (that file is the source of
truth for the palette — keep the two in sync). It's a warm-paper, hard-edge
poster look, not a soft corporate one: thick near-black borders, a flat
mustard accent, and offset "pop" shadows with zero blur (a shape drawn by an
edge, not a glow) — the opposite of `progress-master-app`'s ambient
drop-shadow ramp, even though the token *names* below are unchanged from it.

**Fonts.** `font-display` (Unbounded, bold/uppercase, headings and primary
buttons) and the default body font (Manrope). Both embedded as base64
`@font-face` data URIs directly in `index.css`, matching how
`design/pravai.html` ships them — no external font request, but it does mean
the CSS bundle is ~100KB heavier than a typical app; worth revisiting (a real
font file + `<link rel="preload">`) if that ever matters for load time.

**Elevation.** `shadow-pop` / `shadow-pop-sm` are the signature move: a hard
4px/3px offset in `--edge`, no blur. Reserved for things that should read as
sitting *above* the page stock — the primary CTA, the active tab, the OTP
digit's focus state — and paired with `.press-pop` (or `.press-pop-sm`),
which collapses the shadow and translates the element by the same offset on
press, so it reads as being pushed flat rather than merely dimming. Ordinary
cards are flat (`shadow-card` resolves to `none`) with just a `border-border`
— see `.card` in `design/pravai.html`. `shadow-raised`/`shadow-float` cover
headers-once-scrolled and sheets/popovers respectively, both softer/ambient
(`shadow-ambient`) since those need real separation from the page, not a
poster edge.

**Surfaces.** `bg-background` (the paper) → `bg-card` (a surface on it) →
`bg-surface-sunken` (a well *inside* a card). Divider between cards is the
quiet `border-border` (`--line`); a divider *within* one is `border-hairline`.
`border-edge` is the loud one — thick, always near-black-on-paper /
cream-on-ink regardless of theme — for anything meant to look cut out of
card stock: buttons, the tabbar, page headers.

**Press.** Every tappable thing bigger than an icon gets `.press` — it sinks
under the finger on the same curve the sheets use. Full-bleed list rows use
`.press-row`, which tints instead of scaling.

**Numbers.** Anything numeric (a score, a count) gets `.numeric` (tabular
figures, tightened tracking) so a refetch cannot make a column of digits jitter.

**Skeletons.** `<Skeleton>` from `src/components/Skeleton.tsx`, shaped like the
thing it stands in for.

**Remote images.** `<SmoothImage>` from `src/components/SmoothImage.tsx`,
never a bare `<img>`, for anything coming off the backend (avatars, question
images). It holds a shimmer until the bitmap decodes, then fades the picture
up out of a blur.

## Behavior layer — what makes it feel native

**Haptics.** One capture-phase listener from `src/lib/haptics.ts` (installed in
`main.tsx`) ticks on every tap of a button/`.press`/`.press-row`.

**Screen transitions.** AppShell keys the routed content by pathname: tab
routes enter with `.screen-tab` (fade + rise), everything else with
`.screen-stack` (slide from the right, like a native push).

**Tab bar.** A dock (`bg-card`, `border-edge`) held off the screen edges; the
active tab flips to a solid `bg-primary` block with its own `border-edge` and
`shadow-pop-sm` (`design/pravai.html`'s `.tab.active`) rather than a
highlight sliding in from off-screen. Tab switches
`navigate(path, { replace: true })` — "back" never pages through tabs.
Re-tapping the active tab smooth-scrolls its page to the top.

**Welcome screen.** `src/components/WelcomeScreen.tsx`, held over the app for
~2.2s after a fresh sign-in, driven by `justSignedIn` in `AuthContext` — which
a restored session never sets.

**Scroll memory.** `ScrollMemory` in AppShell records every page scroller
(`.overflow-y-auto`) live and restores the position when a route is revisited.
A page's main scroller must keep that class.

**Text is not selectable** (`user-select: none` app-wide, inputs excepted) and
double-tap does not zoom — both set globally in `index.css`.

## Auth flow

`sendOtp(phone)` → `POST /auth/otp/send`. `verifyOtp(phone, code)` →
`POST /auth/otp/verify` with a per-device id (`src/lib/deviceId.ts`, a UUID
persisted outside the user-scoped storage keys so it survives sign-out) —
the response is a bare token pair + minimal user, persisted immediately via
`src/auth/session.ts`. No separate registration or profile-completion step:
a new phone is silently created by the backend (`is_new_user` in the
response is informational only). `AuthContext` then calls `GET /users/me`
once to hydrate the fuller profile (avatar, `app_language`).

`src/api/request.ts` is the one axios instance: attaches the bearer token,
unwraps the plain JSON body (`{"error": "..."}` on failure, the resource
directly on success, `undefined` on a 204), and on a 401 calls
`src/api/tokenRefresh.ts` (single-flighted) once before giving up via
`unauthorizedHandler.ts`.

## Localization

`src/i18n/{en,ru,uz}.ts`, one flat dictionary each, matching the backend's own
`uz`/`en`/`ru` support. **Uz is the fallback** (not English) — mirrors the
backend's `Translations.Resolve`, which also falls back to `uz`. Never
hardcode a user-facing string; add a key to all three files. The active
language starts from `navigator.language`, then gets overwritten by the
signed-in user's `app_language` from the backend (`LocaleContext`'s
`syncBackendLang`, fired on mount and on the `pravai-authenticated` event).
Changing it via the in-app switcher calls `PATCH /users/me/language`.

## Data/caching conventions (`src/api/queryClient.ts`)

Staleness tiers: `live` (0, default — refetch on every mount), `feed` (60s,
for future paginated lists), `reference` (30min, for static reference data).
Query keys are **not** user-scoped; `resetQueryCache()` is called whenever the
signed-in user id changes (sign-out, forced logout, switching accounts) —
`AuthContext` owns this.

## Pre-push checks

`npm run build` (`tsc -b && vite build`) and `npx eslint src`.
