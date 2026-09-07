# PravAI Mobile WebView — conventions

React 19 + TypeScript + Vite, Tailwind v4, React Query, react-router v7 (HashRouter).
Meant to run inside a native iOS/Android WebView shell; `src/lib/nativeBridge.ts` is
the boundary to it (no shell exists yet -- see "Status" below).

This project was scaffolded from `progress-master-app` (a sibling product's
mobile webview, same architecture) by stripping its e-commerce domain and
rewiring auth to PravAI's own backend. The design layer went through three
passes: a port of PravAI's poster-style prototype (`design/pravai.html` in the
main `pravai` repo), then an iOS-glass/glassmorphism look, then the current
one -- Telegram/iMe-style floating glass chrome -- per product direction.
`design/pravai.html` is no longer the visual source of truth for this app —
only its mustard brand color (`#FFC531`) carries over. The **app mechanics**
(press states, screen transitions, scroll memory, the tabbar's
measurement/render split, safe-area handling) are carried over unchanged from
`progress-master-app` on purpose: they're solved interaction problems, not
decisions specific to any product's branding.

## Status (read this before adding a screen)

**Real and working, verified against the live API (`pravai-api.ai-bek.com`):**
phone+OTP sign-in with a distinct registration step for a phone with no
existing account (see "Auth flow" below), session persistence + silent
refresh-on-401, `GET/PATCH /users/me`,
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

Everything below is defined once in `src/index.css`, as a light/dark pair
(`:root` is light, `html.dark` overrides -- see `src/lib/theme.ts`; dark is
the app's *default*, light is the opt-in choice, the reverse of the usual
convention). Both palettes share the same structure: a distinction between
two materials:

- **Content** (`bg-card`, list rows, form fields) is flat and opaque (a
  content-colour step above the canvas colour -- `#1C1C1E` on `#000` in dark,
  `#F7F7F8` on `#FFFFFF` in light). No blur, no translucency -- it's what's
  scrolling *underneath* the chrome.
- **Chrome** (`bg-chrome` + `.glass`: the tab bar, header back/action
  buttons, bottom sheets) is translucent and blurred
  (`backdrop-filter: blur(24px) saturate(180%)`), and floats as its own
  rounded-full "island" inset from the screen edges -- never a bar flush with
  them. The blur only reads as glass because there's opaque canvas-colour
  content behind it to blur; that's the whole point of the content/chrome
  split, and why both palettes keep a strong canvas/card contrast.

The switcher lives in `MyInfoPage` ("Mode" row, next to "Language"): it calls
`setThemePref`/reads `getThemePref` from `src/lib/theme.ts`, which toggles the
`dark` class on `<html>` and persists the choice to `localStorage`
(`STORAGE_KEYS.theme`). `setThemePref` only touches the DOM/storage, not React
state -- any component displaying the current mode (like that row's own
label) has to hold its own `useState(() => getThemePref())` and update it
alongside the call, the same pattern `LocaleContext` uses for language.

Mustard (`--primary: #FFC531`) is the one brand color carried through every
pass this app has been through.

**Fonts.** System font stack (`-apple-system, BlinkMacSystemFont, 'SF Pro
Text'/'SF Pro Display', ...`) for both `font-display` and body text — no
embedded webfonts, so the CSS bundle stays small and text renders as San
Francisco on a real iOS device with zero font-loading cost.

**Chrome shape.** Every floating control is its own pill, not part of a
spanning bar: `AppTabbar` is `absolute`, inset `left-3.5 right-3.5` off the
bottom with `rounded-full`; `PageHeader`'s back button is a standalone `w-10
h-10 rounded-full` circle, not the left edge of a header bar; a bottom sheet
(see `MyInfoPage`'s language picker) is `rounded-[28px]` on *all four*
corners and inset from every edge, not just the top two flush with the
screen's bottom/sides. Content pages using `PageHeader` are `relative` with
the header `absolute` over them -- the page supplies its own top padding
(`calc(var(--safe-top) + ~50-56px)`) to clear it, and tab-root pages
(`HomePage`, `TestsPage`, etc.) pad their bottom with `pb-28` to clear the
floating tab bar instead of it taking flex space.

**Elevation.** All shadows are soft and ambient — no hard offsets.
`shadow-chrome` is for the floating pills; `shadow-brand` (mustard-tinted
glow) marks the primary CTA and brand tiles; `shadow-float` is for the
welcome screen's icon. Flat content cards carry `shadow-card: none` — their
separation from the canvas comes from the `#1C1C1E`-on-`#000` color step, not
a shadow. Press feedback is `.press` (opacity dip + slight scale) and
`.press-tab` (opacity dip only).

**Buttons.** Primary actions are full pill shapes (`rounded-full`) in
`bg-primary text-primary-foreground` — match `LoginPage.tsx`'s submit button
or `MyInfoPage.tsx`'s edit button for the current convention.

**Surfaces.** `bg-background` (`#000`, the canvas) → `bg-card` (`#1C1C1E`,
flat content) → `bg-chrome` + `.glass` (translucent, floating only). Divider
between cards is the quiet `border-border`; a divider *within* one is
`border-hairline`. Don't reach for `bg-card` on something meant to float over
content -- that's what `bg-chrome`/`.glass` are for, and mixing the two
undoes the content/chrome distinction the whole theme depends on.

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
persisted outside the user-scoped storage keys so it survives sign-out).

The backend no longer auto-registers: a phone with an existing account gets
a token pair + minimal user back (same as before, persisted immediately via
`src/auth/session.ts`); a phone with no account gets a 404 with
`code: "user_not_found"` plus a short-lived `registration_ticket`.
`authService.verifyOtp` turns that specific 404 into a thrown
`UserNotFoundError` (carrying the ticket) rather than a generic failure;
`AuthContext.verifyOtp` catches it *inside* the `run()` wrapper and resolves
to `{status: 'user_not_found', registrationTicket}` instead of rejecting, so
it's a normal three-way outcome (`ok` / `user_not_found` / thrown error) for
`LoginPage` to switch on -- not an error path. `LoginPage`'s `register` step
is a real form (full name + date of birth, `<input type="date">` bounded to
today/120-years-ago to match the backend's own `identity.ValidateDateOfBirth`)
and calls `register(phone, ticket, fullName, dateOfBirth)` → `POST
/auth/register`, which consumes the ticket in place of the OTP (no second
SMS), creates the account with those two fields already set, and returns the
same token-pair shape as verify -- both fields also come back from `GET
/users/me` and show up read-only in `MyInfoPage`. Either path ends the same
way: `AuthContext` persists the
session, then calls `GET /users/me` once to hydrate the fuller profile
(avatar, `app_language`).

`sendOtp`/`verifyOtp`/`register` all pass `?lang=` (the UI's current
language, via `i18n/activeLang.ts`) on every call -- there's no saved
`app_language` yet at any point before a session exists, so this is the only
way the backend knows what language to localize its error messages into
(`{"error": "...", "code": "..."}`, both server-localized now -- see
`getAuthErrorMessage` in `AuthContext.tsx`, which no longer runs backend
error text through a client-side translation table).

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
