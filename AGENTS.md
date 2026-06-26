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
  lib/           Utilities (mdx, formatDate, rateLimiter)
  styles/        Global SCSS variables and breakpoints
  test/          Vitest setup (jsdom, RTL)
  types/         TypeScript type definitions
e2e/             Playwright E2E tests
__mocks__/       Vitest manual mocks
```

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
