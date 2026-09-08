# Reference home design

## Learning screens

Profile now includes personal accuracy and completion statistics, current streak,
practice points, admin-defined automatic and manual awards, recent results, expandable
mistake reviews, theme/language controls, and a sign-out confirmation. A historical
best streak keeps the five-day milestone earned after a gap.

Tests now includes a recommended practice card, resume action, searchable dynamic
test types, template counts, and a tutor entry point. Recommendations open a
matching available practice template when possible; otherwise they draft a
targeted tutor question. Admin-defined test types remain visible.

Chat opens with personalized draft suggestions: weak-topic practice, latest-result
review, a concrete mistake, and a ten-minute plan. Drafts cite actual counts and
answers from GET /api/v1/exam/learning-insights. Selection never auto-sends.
The backend independently fetches the caller's bounded learning context for each
reply. Generic prompts remain available if history is empty or fails to load.
Results also offer a direct Review with AI action.

New-chat actions reset the conversation and composer. Closed history drawers
are inert. The composer supports multiline drafts and restores input on errors.
All new strings support Uzbek, English, and Russian.

Verified at widths 320, 390, 768, and 1024 with fixture-backed browser checks of
draft selection, streaming, conversation reset, test search/recommendation routes,
profile milestones, theme selection, and error fallback. Go tests verify learning
context bounds and authenticated ownership; local PostgreSQL checks verify query
isolation and that active exams never reveal answer keys through review.

Home matches the supplied dark teal reference with mint accents, road artwork,
custom SVG icons, progress cards, topic accuracy rows, a tutor banner, and one
three-tab navigation pill with a separate circular AI-chat button. At 700px and below the overview stacks and the
feature tiles form two columns. Other screens inherit the updated dark palette.
Light theme remains supported.

Icons: public/icons/index.html for previews, public/pravai-icons.zip for the
complete collection. SVGs are custom recreations rather than screenshot crops.
Dark mode retains the pre-existing road images. Light mode uses generated daylight
variants, contrast-adjusted SVG icons in public/icons/light, and light streak,
status, and tutor surfaces. Theme changes switch artwork immediately through CSS.
See public/images/LIGHT_ARTWORK.md for generation prompts and asset provenance.

## Live behavior

- Readiness, daily challenge, and topic accuracy use GET /api/v1/exam/home.
- The additive daily_streak response contains current_days, points, and five
  calendar days (date, completed, is_today). Older backends remain compatible.
- Streaks use Asia/Tashkent dates and completed daily-challenge attempts only.
  Multiple completions on one day count once. Yesterday's streak remains active
  until today ends. Practice points equal 10 per distinct completed day, so five
  days earn 50 points. Points are informational, not a redeemable balance.
- Rating opens personal practice points, not a global leaderboard.
- Mistakes jumps to topic performance. Topic rows and the tutor recommendation
  prefill the AI chat; the user sends the draft. Quick rules opens a tutor draft.
- The notification bell shows unread inbox counts and opens `/notifications`.
  Opening a notification marks it read and follows its allowlisted destination.
- Profile awards load from GET /api/v1/awards, including localized labels and
  server-computed earned status. The admin can define milestones or manual grants.

Backend changes must be deployed with the frontend to show real streaks.
Awards and notifications require backend migration 000030_admin_engagement.
Delivery is in-app only, not OS push. Existing history resolves challenge mode
from the template; edits to a template's mode can affect the derived points.

## Validation

Production build, ESLint, Go tests, and a local PostgreSQL check of the streak
query. Browser checks use intercepted fixture responses, never production OTP
or test submissions. Preview account values are fixtures, not default app data.
