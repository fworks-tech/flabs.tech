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
- **Posts** — Engineering blog with MDX posts on GraphQL Federation and multi-agent AI
- **About** — Full professional bio, location, social links, and skill tags across Frontend · Backend & APIs · AI & Agents

### Technical
- **Next.js 16** App Router with full TypeScript
- **Once UI** design system — component-driven, SCSS Modules for overrides
- **MDX** content pipeline for blog posts and project detail pages with gray-matter
- **Dynamic OG images** via `next/og` — auto-generated for every page
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
| Deployment | Vercel |

---

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Content files

| File | Purpose |
|------|---------|
| `src/resources/content.tsx` | Bio, work experience, skills, social links |
| `src/resources/once-ui.config.ts` | Theme, colors, routes, SEO schema |
| `src/app/blog/posts/*.mdx` | Blog posts |
| `src/app/projects/projects/*.mdx` | Project detail pages |

---

## Contact

- Site: [flabs.tech](https://flabs.tech)
- LinkedIn: [linkedin.com/in/fabiorborges](https://www.linkedin.com/in/fabiorborges)
- GitHub: [github.com/fworks-tech](https://github.com/fworks-tech)
