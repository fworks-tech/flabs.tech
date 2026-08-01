# flabs.tech — portfolio site

Next.js 16 App Router with TypeScript, SCSS Modules, Once UI design system.

## Commands

```sh
npm run dev          # dev server
npm run build        # production build
npm run start        # start production server
npm run lint         # ESLint flat config
npm run typecheck    # tsc --noEmit (strict)
npm run format       # Prettier
npm test             # vitest run
npm run test:watch   # vitest (watch mode)
npm run test:coverage # vitest with v8 coverage
npm run test:e2e     # playwright test (all browsers)
npm run test:e2e:ci  # playwright chromium only, no visual snapshots
npm run test:e2e:update-snapshots  # update visual baselines
npm run storybook    # Storybook dev server
npm run build-storybook  # static Storybook export
npm run analyze     # bundle analyzer
npm run lhci        # local Lighthouse CI run
```

## Verification order (CI)

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run test:e2e:ci`
5. Lighthouse CI (`lhci autorun`)

Run all three (lint → typecheck → test) before committing.

## Architecture

```
src/
  app/           Next.js App Router pages (about, blog, projects, work)
  components/    Shared components (layout/, ui/, shared/)
  config/        Once UI theme and site config
  content/       MDX source for blog, projects, work entries
  features/      Feature modules (about, blog, projects, work)
  hooks/         Custom React hooks
  lib/           Utilities (mdx, formatDate, rateLimiter, abuse/)
  styles/        Global SCSS variables and breakpoints
  test/          Vitest setup (jsdom, RTL)
  types/         TypeScript type definitions
e2e/             Playwright E2E tests
__mocks__/       Vitest manual mocks
```

## Abuse prevention (`src/lib/abuse/`)

The AI chat endpoint is protected by a deterministic abuse pipeline (see `docs/adr/002-abuse-prevention.mdx`):

- **Pipeline:** resolveKey → recordSignal (investigation) → quarantine tiers (throttle → soft-quarantine → hard-block) → decideResponse → notify
- **Scoring:** logistic model over a fixed feature vector; features decay with a 30-min half-life so actors auto-recover
- **Injection detection:** two-tier — `BLOCK_PATTERNS` (unambiguous) vs `SUSPICIOUS_PATTERNS` (role-play, signal-only); a first offense is recorded but never rejected
- **Modes:** `ABUSE_RESPONSE_MODE=shadow` (default, observes + alerts) or `enforce` (blocks)
- **Persistence:** Upstash Redis (`UPSTASH_REDIS_REST_URL/TOKEN`) with in-memory fallback
- **Privacy:** `ABUSE_TRACK_IP=false` → HMAC keyed with `ABUSE_KEY_SECRET` (pseudonymization); alert recipients (PostHog/webhooks) only see masked keys
- **Identity:** client IP comes from the *rightmost* `X-Forwarded-For` entry (trusted proxy appends it; leftmost is spoofable)

Required env vars: `OPENCODE_API_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN`, `POSTHOG_API_KEY`; optional: `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `ABUSE_KEY_SECRET`, `ABUSE_RESPONSE_MODE`, `ABUSE_TRACK_IP`, `ABUSE_RETENTION_MS` (see `.env.example`).

## Code style

- TypeScript strict mode, `@/` path alias for `src/`
- SCSS Modules for styling (`.module.scss`), global styles in `src/styles/`
- Tests co-located in `__tests__/` dirs next to source files
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `ci:`, `perf:`
- No pre-commit hooks; CI enforces quality gates
- PRs require CI to pass (lint → typecheck → test → e2e)

## Testing

- **Unit:** Vitest + React Testing Library, jsdom environment
  - `npm test` to run all, `npx vitest run -t "test name"` for a single test
- **E2E:** Playwright with chromium + webkit (locally), chromium only (CI)
  - E2E tests in `e2e/`, a11y via axe-core, visual snapshots in `e2e/screenshots/`
- Coverage tracked for `src/lib/`, `src/hooks/`, `src/components/`, `src/features/`

## Git workflow

- Branch naming: `<type>/<issue-number>-<slug>` (e.g. `feat/131-dark-mode`)
- Open an issue first, then branch, PR, merge
- PR template at `.github/pull_request_template.md`
