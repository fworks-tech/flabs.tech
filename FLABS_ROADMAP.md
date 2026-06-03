# flabs.tech Personalization Roadmap

**Status:** ✅ Planning Complete | Issues & Milestones Created

## Overview

This document outlines the plan to transform flabs.tech from a template to a personal portfolio reflecting Fabio's brand, projects, and thought leadership.

**Current State:** Magic Portfolio template (Next.js + Once UI) with all placeholder content  
**Target:** Personal site showcasing Fabio's identity, hobby projects, and insights

---

## Implementation Plan

The work is organized into 5 sequential milestones, each with clear acceptance criteria.

### 🎨 Milestone 1: Core Identity & Configuration (5 issues)

**Goal:** Personalize the template with Fabio's branding and identity.

| Issue | Title | Priority |
|-------|-------|----------|
| #1 | Update content.tsx with personal info | 🔴 High |
| #2 | Customize colors to indigo + obsidian theme | 🔴 High |
| #3 | Update domain and metadata to flabs.tech | 🔴 High |
| #4 | Replace avatar and gallery images | 🟡 Medium |
| #5 | Add/redesign site footer with social links | 🟡 Medium |

**Key Details:**
- Color scheme: Indigo-400 (#818cf8) + Obsidian (#07091a) — sci-fi minimal aesthetic (from fritzelborges lessons)
- Replace all cyan references with indigo
- Ensure color contrast meets WCAG AA (≥4.5:1)
- Footer: minimal design with Lucide social icons

---

### 📁 Milestone 2: Work & Projects (3 issues)

**Goal:** Populate the Work section with Fabio's projects.

| Issue | Title |
|-------|-------|
| #6 | Create 2-3 work projects in MDX format |
| #7 | Add project thumbnail images |
| #8 | Ensure consistent tech stack display |

**Key Details:**
- Create 2-3 MDX files in `src/app/work/projects/`
- Upload 1200×630px WebP images for project thumbnails
- Verify tech stack tags display consistently across projects

---

### 📝 Milestone 3: Blog Content (2 issues)

**Goal:** Set up a fresh blog with personal content.

| Issue | Title |
|-------|-------|
| #9 | Delete template blog posts and create inaugural content |
| #10 | Customize blog section intro |

**Key Details:**
- Remove all 11 placeholder Once UI documentation posts
- Create 1-3 new blog posts on topics Fabio cares about
- Configure newsletter signup (optional, via Mailchimp/Substack/Resend)

---

### ⚡ Milestone 4: Performance & SEO (5 issues)

**Goal:** Ensure professional quality standards before launch.

| Issue | Title | From fritzelborges |
|-------|-------|------------------|
| #11 | Implement OG image generation | #51 |
| #12 | Bundle audit and performance budgets | #37, #76 |
| #13 | Add Lighthouse CI to GitHub Actions | #70 |
| #14 | Accessibility audit (WCAG 2.1 AA) | #75 |
| #15 | Add Vercel Analytics and Speed Insights (optional) | #71 |

**Key Details:**
- Dynamic OG images via `next/og` (1200×630px)
- Lighthouse CI thresholds: perf ≥90, a11y ≥95, best-practices ≥90
- Manual a11y audit: keyboard nav, focus rings, contrast, alt text
- Track Core Web Vitals in production (optional)

---

### 🚀 Milestone 5: Polish & Deploy (2 issues)

**Goal:** Final validation and live launch.

| Issue | Title |
|-------|-------|
| #16 | Full site smoke test |
| #17 | Deploy to production and verify live |

**Key Details:**
- Walk through all pages: /, /about, /work, /blog, /gallery
- Test desktop, tablet, mobile (375px viewport)
- Verify no broken links, no console errors
- Deploy via Vercel to https://flabs.tech

---

## Lessons from fritzelborges

The fritzelborges project (77 issues) informed this plan. Key learnings incorporated:

**Design & Aesthetics:**
- Indigo + obsidian color scheme (professional sci-fi minimal)
- Minimal footer with social icons
- Emphasis on clean, intentional typography

**Quality Gates:**
- Lighthouse CI enforces performance & accessibility baselines
- Manual a11y audit before launch (WCAG 2.1 AA)
- OG image generation for rich social previews
- Bundle analysis to prevent unexpected size bloat

**Out of Scope (for flabs.tech):**
- Complex animations (Once UI provides what's needed)
- Custom component library (template is feature-complete)
- Multi-language i18n (EN only)
- Contact form / Server Actions (not required for portfolio)

---

## Verification Strategy

**Per Milestone:**
- Run `npm run dev` locally
- Visually inspect all pages
- Check browser console for errors

**End-to-End:**
- Test on desktop, tablet, mobile
- Verify keyboard navigation and focus rings
- Check all social links are correct
- Test OG images in Twitter/LinkedIn card validators
- Deploy to Vercel and verify production

---

## Timeline & Sequencing

**Milestone 1** (Core Identity) is **critical** — all other milestones depend on it.

- **M1 → M2 & M3:** Can proceed in parallel once M1 complete
- **M4 (Performance):** Can run in parallel with M2 & M3 (mostly CI setup)
- **M5 (Deploy):** Final gate after M2, M3, M4 complete

**Estimated effort:**
- M1: 4–6 hours (config, assets, images)
- M2: 3–4 hours (project content, images)
- M3: 2–3 hours (blog content, newsletter)
- M4: 3–4 hours (OG endpoint, CI setup, a11y audit)
- M5: 1–2 hours (smoke test, deploy)

**Total: 13–19 hours** (depending on content volume)

---

## Agenthood Standards

This roadmap respects fworks-tech member principles:

✅ **The Architect:** Spec-driven planning (this document)  
✅ **The Scribe:** Conventional commits + PR descriptions (forthcoming)  
✅ **The Reviewer:** Five-axis code review before merge  
✅ **The Tester:** Quality gates (Lighthouse CI, a11y audit)  
✅ **The Auditor:** WCAG 2.1 AA accessibility baseline  

**Branch Standard:** Feature branch per milestone (e.g., `feat/flabs-core-identity`)  
**Merge Strategy:** PR → Review → Merge to main → Verify production

---

## Getting Started

### Next Steps

1. **Assign M1 issues** to team members or self
2. **Gather content:**
   - Professional photo (avatar)
   - 8 gallery images
   - Personal bio and social links
   - 2-3 project descriptions
   - 1-3 blog post ideas

3. **Start M1.1:** Update `src/resources/content.tsx` with personal info
4. **Proceed M1 → M1.5** to establish visual brand
5. **Unlock M2 & M3** for content population

### Resources

- **Template docs:** Check Once UI docs for component customization
- **Lighthouse CI:** Docs at https://github.com/GoogleChrome/lighthouse-ci
- **GitHub Issues:** https://github.com/fworks-tech/flabs.tech/issues
- **Implementation Plan:** See `/plans/i-bought-the-domain-wondrous-dahl.md`

---

## Questions?

- Refer to the GitHub issues for detailed acceptance criteria
- Check Agenthood standards at `/Github/agenthood`
- Memory: `fritzelborges_lessons.md` contains detailed design/QA learnings

---

**Created:** 2026-06-03  
**Version:** 1.0  
**Owner:** Fabio Ritzel Borges  
**Status:** ✅ Ready to Implement
