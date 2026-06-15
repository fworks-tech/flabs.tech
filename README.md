# flabs.tech

**Personal portfolio of Fábio Ritzel Borges** — Senior Full-Stack Engineer & AI Systems Architect

Live at **[flabs.tech](https://flabs.tech)**

---

## Features

### Design & UX
- **Particle background** — Canvas-based floating dots with mouse magnetism, no external dependencies
- **Near-black dark theme** (`#060608`) with indigo accents; adapts cleanly to light mode
- **Animated headline** — Character-by-character stagger entrance with shimmer sweep on load
- **Responsive layout** — Full desktop nav, mobile bottom pill nav; hero and grids collapse gracefully
- **Theme-aware header** — Background adapts to light/dark using CSS variables

### Pages
- **Home** — Split hero with animated headline + CTAs, 3-column project grid, recent posts section
- **Work** — Professional experience timeline: 7 companies across USA, Europe, and Brazil, plus education
- **Projects** — 7 open-source projects with MDX detail pages and GitHub links: Agenthood, Driveline ELD, ApolloDroid, VeriHire, Jupyter Crypto Wizard, Fashionista, flabs.tech
- **Blog** — Engineering blog with MDX posts on GraphQL Federation and multi-agent AI
- **About** — Full professional bio, location, social links, and skill tags across Frontend · Backend & APIs · AI & Agents

### Technical
- **Next.js 16** App Router with full TypeScript
- **Once UI** design system — component-driven, SCSS Modules for overrides
- **MDX** content pipeline for blog posts and project detail pages with gray-matter
- **Dynamic OG images** via `next/og` — auto-generated for every page with 1200×630 (1.91:1)
- **Profile photo favicon** generated server-side via `icon.tsx` (no binary files)
- Deployed on **Vercel** with PR preview deployments

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| UI System | Once UI |
| Language | TypeScript |
| Content | MDX + gray-matter |
| Styling | SCSS Modules |
| Bundler | Turbopack |
| Deployment | Vercel |

---

## Project structure

```
src/
├── app/              # Next.js App Router (routes, API, layout)
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
├── styles/           # Global SCSS/CSS
└── types/            # Shared TypeScript types
```

Layered dependency rule: inner layers (`lib/`, `config/`) never import from outer layers (`features/`, `app/`).

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run all unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with v8 coverage report |

**Stack:** Vitest 4 · React Testing Library · jsdom · v8 coverage

**Convention:** Tests live in `__tests__/` directories next to the files they cover.

```
src/lib/mdx.ts          → src/lib/__tests__/mdx.test.ts
src/hooks/useMousePosition.ts → src/hooks/__tests__/useMousePosition.test.ts
src/components/ui/AnimatedHeadline.tsx → src/components/ui/__tests__/AnimatedHeadline.test.tsx
```

**Mocks:** Centralized in `__mocks__/` at project root:
- `@once-ui-system/core` — all components, providers, hooks
- `next/navigation` — useRouter, usePathname, notFound
- `gray-matter` — frontmatter parser

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
