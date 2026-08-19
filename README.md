# flabs.tech

**Personal portfolio of Fabio Borges** — Full Stack Web Developer & AI Engineer

Live at **[flabs.tech](https://flabs.tech)**

---

## Features

### Design & UX
- **Particle background** — Canvas-based floating dots with mouse magnetism, no external dependencies
- **Near-black dark theme** (`#060608`) with indigo accents; adapts cleanly to light mode
- **Animated headline** — Character-by-character stagger entrance with shimmer sweep on load
- **Responsive layout** — Full desktop nav, mobile bottom pill nav; hero and grids collapse gracefully
- **Theme-aware header** — Background adapts to light/dark using CSS variables
- **WCAG 2.1 AA** — Skip-to-content link, semantic landmarks, focus-visible styles, aria-labels, keyboard nav, 44px touch targets

### Pages
- **Home** — Split hero with animated headline + CTAs, 3-column project grid, recent posts section
- **Work** — Professional experience timeline: 7 roles across 6 companies in the USA, Europe, and Brazil, plus education
- **Projects** — Featured projects with MDX detail pages and GitHub links, sourced from the fworks-tech GitHub profile: Agenthood, Agenthood Site, ArXiv Manager, atlaslink (coming soon), HashEyes, LogRoute, flabs.tech
- **Blog** — Engineering blog with MDX posts on GraphQL Federation, multi-agent AI, and skills registries
- **About** — Full professional bio, location, social links, and skill tags across Frontend · Backend & APIs · AI & Agents
- **Quiz (DevSprint)** — Timed dev-trivia game: 20s per question, streaks, achievements, weekly leaderboard (Upstash Redis), referral sharing
- **AI Assistant** — Chat widget on every page; answers about the site's content and author via OpenCode Zen (`mimo-v2.5`). Equipped with tools: GitHub repo stats, authorized URL fetching, and content search across blog/projects

### Technical
- **Next.js 16** App Router with full TypeScript
- **Once UI** design system — component-driven, SCSS Modules for overrides
- **MDX** content pipeline for blog posts and project detail pages with gray-matter
- **Dynamic OG images** via `next/og` — auto-generated for every page with 1200×630 (1.91:1)
- **Profile photo favicon** generated server-side via `icon.tsx` (no binary files)
- **Abuse prevention** for the AI chat endpoint — deterministic pipeline (`src/lib/abuse/`): signal scoring → quarantine tiers → shadow/enforce modes; privacy-first HMAC keyed identities
- **AGENTS.md** — AI agent instructions (build/test commands, conventions, git workflow)
- Deployed on **Vercel** with PR preview deployments

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI System | Once UI + Mantine |
| Language | TypeScript |
| Content | MDX + gray-matter |
| Styling | SCSS Modules |
| AI Runtime | Vercel AI SDK v7 + OpenCode Zen (OpenAI-compatible, `mimo-v2.5`) |
| Storage | Upstash Redis (leaderboard, sessions, abuse signals) |
| Observability | PostHog · pino + OpenTelemetry logs |
| Linting | ESLint 9 (flat config) + Prettier |
| Bundler | Turbopack |
| Type Checking | TypeScript 5.8 (`tsc --noEmit`) |
| Testing | Vitest 4 · Playwright · axe-core · Lighthouse CI |
| Storybook | Storybook 10 |
| Bundle Audit | @next/bundle-analyzer |
| CI/CD | GitHub Actions (lint → typecheck → test + e2e parallel, lighthouse → test) |
| Deployment | Vercel |

---

## Project structure

```
src/
├── app/              # Next.js App Router (routes, API, layout)
│   ├── api/          #   chat, quiz/*, authenticate, analytics, og, rss, auth
│   └── quiz/         #   DevSprint quiz game
├── components/       # Presentational components by role
│   ├── layout/       #   Header, Footer, Providers, RouteGuard
│   ├── ui/           #   Mailchimp, HeadingLink, ProjectCard
│   └── shared/       #   MDX renderer, shared utilities
├── config/           # App configuration (Once UI, icons, barrel)
├── content/          # Editorial data (bio, experience, MDX posts)
│   ├── blog/         #   Blog post MDX files
│   ├── work/         #   Work experience MDX files
│   └── projects/     #   Project detail MDX files
├── features/         # Domain-specific components (by page)
├── hooks/            # Custom React hooks
├── lib/              # Pure utility functions
│   ├── abuse/        #   AI chat abuse-prevention pipeline
│   └── ai/           #   Chat tool definitions + web search
├── styles/           # Global SCSS/CSS
└── types/            # Shared TypeScript types
```

Layered dependency rule: inner layers (`lib/`, `config/`) never import from outer layers (`features/`, `app/`).

---

## Local development

```bash
npm install
cp .env.example .env   # fill in keys (see Env vars)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Storybook

```bash
npm run storybook       # Start at http://localhost:6006
npm run build-storybook # Static build
```

### Env vars

Required: `OPENCODE_API_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN`, `POSTHOG_API_KEY`; optional: `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `ABUSE_KEY_SECRET`, `ABUSE_RESPONSE_MODE`, `ABUSE_TRACK_IP`, `ABUSE_RETENTION_MS` (see `.env.example`).

---

## Testing

### Unit tests

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with v8 coverage report |

**Stack:** Vitest 4 · React Testing Library · jsdom · v8 coverage · 514 tests across 81 test files

**Convention:** Tests live in `__tests__/` directories next to the files they cover.

```
src/lib/mdx.ts                         → src/lib/__tests__/mdx.test.ts
src/lib/rateLimiter.ts                 → src/lib/__tests__/rateLimiter.test.ts
src/hooks/useMousePosition.ts          → src/hooks/__tests__/useMousePosition.test.ts
src/components/ui/ProjectCard.tsx      → src/components/ui/__tests__/ProjectCard.test.tsx
src/features/work/ProjectGrid.tsx      → src/features/work/__tests__/ProjectGrid.test.tsx
src/features/projects/ProjectsList.tsx → src/features/projects/__tests__/ProjectsList.test.tsx
src/features/about/TableOfContents.tsx → src/features/about/__tests__/TableOfContents.test.tsx
```

### E2E tests

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e:ui` | Interactive UI mode |
| `npm run test:e2e:chrome` | Chromium only |
| `npm run test:e2e:ci` | Chromium only, no visual snapshots (CI) |
| `npm run test:e2e:update-snapshots` | Update visual baselines |

**Stack:** Playwright 1.x · axe-core · navigation, pages, a11y, visual snapshots, API routes, responsive, AI assistant, sign-in

**Browsers:** Chromium + WebKit (local) · Chromium only (CI)

**Structure:**
```
e2e/
├── navigation.spec.ts       # Header links, click nav
├── accessibility.spec.ts    # axe-core WCAG 2.1 AA scans
├── smoke.spec.ts            # All routes return 200
├── errors.spec.ts           # 404, error states
├── api-routes.spec.ts       # API endpoint checks
├── aux-routes.spec.ts       # Sitemap, robots, RSS
├── responsive.spec.ts       # Viewport breakpoints
├── analytics.spec.ts        # PostHog event capture
├── signin.spec.ts           # Auth redirect flow
├── ai-assistant.spec.ts     # Chat open/send/tool responses
├── ai-assistant.screenshots.spec.ts  # Chat visual snapshots
├── pages/
│   ├── home.spec.ts         # Title, favicon, OG meta
│   ├── about.spec.ts        # Title, social links
│   ├── blog.spec.ts         # Listing, post nav
│   ├── work.spec.ts         # Timeline
│   ├── work-detail.spec.ts  # Case study pages
│   └── projects.spec.ts     # Grid, detail nav
└── screenshots/
    └── pages.spec.ts        # Full-page desktop snapshots
```

### CI pipeline

```
push/PR to main
  ├── test job:       npm install → npm run lint → npm run typecheck → vitest
  ├── e2e job:        npm install → playwright install chromium → playwright test
  └── lighthouse job: npm install → npm run build → lhci autorun (needs: test)
```

**Mocks:** Centralized in `__mocks__/` at project root:
- `@once-ui-system` — all components, providers, hooks
- `next/` — navigation, headers (router, pathname, notFound)
- `gray-matter.ts` — frontmatter parser

---

## Security

- **Security headers** via `vercel.json` — CSP, HSTS (preload), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy
- **Rate limiting** on all public APIs — `/api/authenticate` (5 req/60s/IP), `/api/chat` (10–30 req/60s/IP), `/api/analytics/event`, and quiz endpoints
- **Session auth** — NextAuth 5 with Upstash Redis sessions; httpOnly, SameSite: strict, Secure cookies
- **AI abuse pipeline** (`src/lib/abuse/`) — deterministic logistic scoring over a decaying feature vector (30-min half-life, actors auto-recover); two-tier prompt-injection detection (block vs. signal); quarantine tiers throttle → soft-quarantine → hard-block; `ABUSE_RESPONSE_MODE=shadow` (observe, default) or `enforce` (block)
- **Privacy** — `ABUSE_TRACK_IP=false` → HMAC-keyed identities (`ABUSE_KEY_SECRET`); alert recipients (PostHog/webhooks) only see masked keys; client IP read from the rightmost `X-Forwarded-For` entry to defeat spoofing

---

## Performance

- **Image optimization** — AVIF & WebP auto-conversion, 1-week cache TTL, responsive sizes
- **Viewport metadata** — theme-color for dark/light mode, device-width scaling
- **Twitter cards** — `summary_large_image` for all pages
- **Lighthouse CI** — performance, a11y, SEO, best-practices thresholds on 5 routes (3 runs each)
- **Bundle analysis** — `npm run analyze` (ANALYZE=true) for visual bundle audit

### Lighthouse CI

| Command | Description |
|---------|-------------|
| `npm run lhci` | Run Lighthouse CI locally |
| `npm run analyze` | Bundle analyzer (opens HTML report) |

Budgets: performance ≥0.8, a11y ≥0.9, best-practices ≥0.9, SEO ≥0.9 · LCP ≤3000ms, CLS ≤0.1

---

## Content files

| File | Purpose |
|------|---------|
| `src/config/once-ui.config.ts` | Theme, colors, routes, SEO schema, newsletter |
| `src/config/icons.ts` | Icon registry |
| `src/content/index.tsx` | Bio, work experience, skills, social links |
| `src/content/blog/*.mdx` | Blog posts |
| `src/content/work/*.mdx` | Work experience entries |
| `src/content/projects/*.mdx` | Project detail pages |

---

## Contact

- Site: [flabs.tech](https://flabs.tech)
- LinkedIn: [linkedin.com/in/fabiorborges](https://www.linkedin.com/in/fabiorborges)
- GitHub: [github.com/fworks-tech](https://github.com/fworks-tech)
