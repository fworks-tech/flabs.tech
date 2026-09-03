# Blog Post Pattern — flabs.tech

> Every new post under `src/content/blog/*.mdx` MUST follow this file. Rules are one line each. Checklist at the bottom is blocking.

Sources of truth: `src/lib/mdx.ts` (frontmatter schema + draft handling), `src/lib/draft.ts` (`isPostVisible`/`filterPosts`), `src/app/api/chat/route.ts` (`MODEL_ID`, `maxDuration`), `src/lib/ai/tools.ts` (tool list, timeouts, allowlist), `src/lib/crosspost.ts` (`canonicalUrl`), `.github/workflows/crosspost.yml` (Dev.to backfill), `docs/adr/*.mdx` (cite, never link).

## 1. Frontmatter schema

Required shape (`src/lib/mdx.ts:14-30`):

```yaml
---
title: 'Title Case After Colon: Capitalize the First Word' # Title Case enforced — see §2
publishedAt: '2026-09-03' # YYYY-MM-DD quoted string, required
summary: '...' # 200–280 chars, required
tag: 'Engineering' # singular single-quoted site taxonomy, required — see §5 (prettier singleQuote)
tags: ['ai', 'agents', 'nextjs'] # plural, ALWAYS present, ≤4 lowercase specific — see §5
subtitle: '...' # one line, differentiates from title, required for new posts
shareText: | # pipe block, required for new posts
  Hook line 1.
  Hook line 2 with specifics.
  Read the full breakdown on flabs.tech # CTA wording is per-post choice; standalone last line required
draft: true # start here; removing it publishes on merge (§6)
---
```

| Field                | Rule                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`              | Title Case after colon (`Hanging: Fixing`, not `Hanging: fixing`) — enforced; rename sentence-case titles on next touch.                          |
| `publishedAt`        | `YYYY-MM-DD` quoted string; must match merge week, not draft-creation date.                                                                       |
| `summary`            | 200–280 chars; states incident + scope + payoff, no clickbait, no filler.                                                                         |
| `tag` | Singular `tag:` with single quotes (prettier `singleQuote`); must be an existing taxonomy value (§5). |
| `tags`               | Plural `tags:` ALWAYS present; ≤4 lowercase specific tags (Dev.to limit); drives chips, SEO keywords, and Dev.to discovery.                       |
| `subtitle`           | Must not restate title; adds angle/stakes.                                                                                                        |
| `shareText`          | 3–6 lines; last line is a standalone CTA — wording is per-post choice.                                                                            |
| `image`              | Always optional; set only when the body embeds images.                                                                                            |
| `draft`              | New posts start `draft: true`; removing it publishes on merge (§6).                                                                               |
| `devtoId`/`devtoUrl` | Leave empty on new drafts; bot backfills after merge (§6).                                                                                        |
| `scheduledAt`        | Optional; future date hides post via `isPostVisible()` even when `draft` is unset.                                                                |
| Forbidden            | Never invent fields; schema is `title/subtitle/publishedAt/summary/image/images/tag/tags/team/link/shareText/draft/scheduledAt/devtoId/devtoUrl`. |

Older posts without `subtitle`/`shareText` are grandfathered; all new posts include both.

## 2. Voice (scribe)

| Rule                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open with a concrete scene (widget state, error text, screenshot), not a thesis.                                                                                         |
| `Principle N:` headings must be rules (`Every Layer Gets Its Own Way to Fail Fast`), never hazards.                                                                      |
| Every table row must resolve in the body — no orphan rows the prose never returns to.                                                                                    |
| Delete filler: `simply`, `just`, `very`, `really`, `basically`; split `and`-stuffed sentences in two.                                                                    |
| No misplaced adverbs; put time/place next to the verb they modify.                                                                                                       |
| Every insider reference (`1/20 budget`, project names, agent names) pays off on the same page.                                                                           |
| Prefer short paragraphs, `---` between sections, closer is a `## Try…` heading + italic `Built with…` footer — heading wording and `*…*` vs `_…_` are per-post variants. |
| Second person for recovery paths (`Ask about Atlaslink today…`); first person plural for postmortem.                                                                     |

## 3. Technical accuracy (reviewer — blocking)

Verify against code, never from memory:

| #   | Rule                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------- |
| T1  | Footer model MUST equal `MODEL_ID` in `src/app/api/chat/route.ts:47` (today `mimo-v2.5`); grep before writing.                   |
| T2  | Count claims MUST match the table and code — an allowlist gate is not a timeout.                                                 |
| T3  | Name full timeout scope: `TOOL_FETCH_TIMEOUT_MS` (`src/lib/ai/tools.ts:19`) covers GitHub fetches AND `fetchUrlContent`.         |
| T4  | State exactly which inputs the model controls: `fetchGitHubRepo` hardcodes `owner="fworks-tech"`; only `repo` is model-supplied. |
| T5  | State total tool counts accurately: 4 tools (`fetchGitHubRepo`, `fetchUrlContent`, `searchContent`, `listGitHubRepos`).          |
| T6  | Checklist (§7) MUST cover every shipped behavior in the diff/ADR, including guards (400 on empty/malformed messages).            |
| T7  | Timeouts nest explicitly when claimed: `10s < 60s < 65s` (tool < `maxDuration` < client).                                        |
| T8  | Soften or cite platform constants: the ~300s kill is a platform default — write `~300s platform default` or cite.                |

## 4. Docs-fit / linking (librarian — HIGH)

| Rule                                                                                                         |
| ------------------------------------------------------------------------------------------------------------ |
| NEVER link `/docs/adr/*` — no `/docs` route exists under `src/app/`; readers would 404.                      |
| Cite ADRs as bold text (`**ADR-004 — AI chat step-termination strategy**`) or absolute GitHub URL.           |
| Footer stack MUST agree with the cited ADR on model/hosting.                                                 |
| Never promise ADR content not recorded there; if it's only in the diff, say the post, not the ADR.           |
| Record a resolution for every diagnosis row (e.g. wildcard `*.flabs.tech` allowlist; 400 guard; retry path). |
| Cross-link series siblings with absolute URLs (`https://flabs.tech/blog/<slug>`), never relative.            |
| CTAs use absolute URLs: `[flabs.tech](https://flabs.tech)`.                                                  |
| Closer is a `## Try…` heading + 1-line recap + italic footer — exact heading wording is a per-post variant.  |

## 5. Tag / slug conventions

| Rule                                                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Slug = filename kebab-case (`never-leave-the-chatbox-hanging.mdx` → `/blog/never-leave-the-chatbox-hanging`).                                                                                                                    |
| Canonical URL is always `https://flabs.tech/blog/<slug>` (`canonicalUrl` in `src/lib/crosspost.ts:22`).                                                                                                                          |
| Blog `tag:` taxonomy is closed — pick one of `AI`, `Engineering`, `Architecture`, `Projects`.                                                                                                                                    |
| Do not introduce a new tag without updating this file.                                                                                                                                                                           |
| `tags[]` is ALWAYS set: ≤4 lowercase specific tags (Dev.to limit); they render as chips + SEO keywords on-site (`Post.tsx:62`, `[slug]/page.tsx:62`) and pass straight to Dev.to, bypassing `DEVTO_TAG_MAP` (`crosspost.ts:42`). |
| Explore the best tags before writing: check Dev.to tag pages for follow counts and match the post's concrete stack (e.g. `nextjs`, `ai`, `agents`) over generic fillers.                                                         |
| Headings use `##` per section, `###` only for enumerated sub-moves.                                                                                                                                                              |

## 6. Draft-vs-publish workflow

| Rule                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New file without `draft: true` publishes on merge (`src/lib/mdx.ts:82` + `isPostVisible` in `src/lib/draft.ts:3`).                                                                                                                   |
| Start every new post with `draft: true`; remove it in the publish PR only.                                                                                                                                                           |
| Public surfaces hide drafts via `filterPosts(posts, isAuthenticated)` (blog pages, sitemap, RSS).                                                                                                                                    |
| Admin preview (`/admin/drafts`) is the only place drafts render; verify there before undrafting.                                                                                                                                     |
| Dev.to is distribution, MDX is canonical (**ADR-001**, **ADR-008**): leave `devtoId`/`devtoUrl` empty.                                                                                                                               |
| `.github/workflows/crosspost.yml` backfills ids via `chore(blog)`; manual fallback is `/admin/publishing`.                                                                                                                           |
| Never hand-edit another post's `devtoId`.                                                                                                                                                                                            |
| Edits to merged posts re-trigger the workflow (any push touching `src/content/blog/**`) and UPDATE the Dev.to article in place — matched by `devtoId` or canonical URL (`crosspost.ts:83-97`), never re-created. Backfills are safe. |

## 7. Pre-publish checklist (all boxes required)

```markdown
- [ ] Frontmatter: title / publishedAt / summary (200–280 chars) / tag / subtitle / shareText present
- [ ] Title Case after colon; subtitle differentiates; shareText ends with standalone CTA line
- [ ] `tag:` is one of AI / Engineering / Architecture / Projects (singular, single-quoted, no new tag)
- [ ] `tags:` present: ≤4 lowercase specific tags, checked against Dev.to tag discovery
- [ ] Slug is kebab-case; cross-links use absolute `https://flabs.tech/blog/<slug>`
- [ ] No `/docs/adr/*` links; ADRs cited as **ADR-NNN — title** or absolute GitHub URL
- [ ] Footer model/version grepped against code (`MODEL_ID`, package versions); matches ADR
- [ ] Every count/table row matches code (tool count, timeout count, scope); gate ≠ timeout
- [ ] Full input-control statement (which args are model-supplied vs hardcoded + validation regex)
- [ ] Every diagnosis row has a recorded resolution (allowlist fix, 400 guard, retry path)
- [ ] Platform constants softened or cited (`~300s platform default`)
- [ ] Principle headings are rules; every table thread resolves in the body; filler cut
- [ ] `draft: true` removed only in publish PR; `devtoId`/`devtoUrl` left for bot backfill
- [ ] `npm run lint`, `npm run typecheck`, `npm test` pass (content still breaks MDX build)
```

_Pattern version: 2026-09-03. Disputes resolved in favor of code > ADR > corpus > review memory._
