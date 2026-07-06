---
name: the-herald
description: Manages semantic versioning, release notes, changelog generation, and scheduled reports. Use before every release to determine the version bump and generate changelog. Use for daily standups and end-of-day summaries.
license: MIT
---

# The Herald

## Overview

The Herald does not release code. It *announces* it. Every release has a version number that means something. Every release has notes that humans can read. Every release was earned — by passing tests, clean commits, and a merged PR. The Herald makes sure everyone knows when something ships, what changed, and what it means.

## When to Use

- Before every release — to determine version bump and generate changelog
- When preparing a GitHub Release
- Daily at 8:00 AM — morning standup report
- Daily at end of day — work summary
- When a stakeholder asks "what shipped this week?"

## Process

### Semantic Version Determination

1. Run `git log <last-tag>..HEAD --oneline` to list commits since last release
2. Scan commit types to determine the version bump:

| Commit type found | Version bump | Example |
|-------------------|-------------|---------|
| Any `feat!` or `BREAKING CHANGE` footer | **Major** `1.0.0 → 2.0.0` | New API incompatibility |
| Any `feat` (no breaking change) | **Minor** `1.0.0 → 1.1.0` | New capability |
| Only `fix`, `perf`, no feat | **Patch** `1.0.0 → 1.0.1` | Bug fixes only |
| Only `chore`, `docs`, `ci`, `test` | **No bump** | Internal only |

3. Announce the determination with reasoning:
   *"Next version: 1.3.0 (minor bump) — 2 feat commits found since v1.2.1."*

### Changelog Generation

1. Group commits since last tag by type
2. Filter: include `feat`, `fix`, `perf`, `refactor` (if user-visible). Exclude `ci`, `chore`, `test`, `docs` (internal)
3. Translate technical subjects to user-facing language:
   - `fix(api): handle null response from geocoding service` → `Fixed an issue where route planning could fail when the location service was unavailable`
   - `feat(ui): add dark mode toggle` → `Added a dark mode toggle in the settings panel`
4. Format following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/):

```markdown
## [1.3.0] - YYYY-MM-DD

### Added
- Description of new feature (#{PR number})

### Fixed
- Description of bug fix (#{PR number})

### Changed
- Description of changed behavior (#{PR number})

### Removed
- Description of removed feature (#{PR number})
```

5. Prepend to `CHANGELOG.md`
6. Link each entry to its PR

### GitHub Release

1. Create a git tag: `git tag v1.3.0`
2. Push the tag: `git push origin v1.3.0`
3. Create a GitHub Release:
   - **Title:** `v1.3.0 — Month Day, Year`
   - **Body:** the formatted changelog section for this version
   - **Link:** "Full changelog: CHANGELOG.md#130"

### Cross-posting to Dev.to

Syndicate blog posts from `src/content/blog/*.mdx` to Dev.to for discovery, with the portfolio URL as canonical.

1. **Detect new or modified posts** — run `git diff origin/main..HEAD --name-only` and filter for `src/content/blog/*.mdx`. New files (added in this branch) need a POST. Modified files with an existing `devtoId` in frontmatter need a PUT.

2. **Read frontmatter** — use `gray-matter` to parse the MDX file. Extract `title`, `summary`, `tags`, `slug`, `devtoId`. If `devtoId` exists, this is an update.

3. **Convert body to plain Markdown** — strip MDX-specific imports, JSX components, and directives that Dev.to does not support. Keep standard Markdown: headings, lists, code blocks, links, images. Dev.to supports GFM (tables, strikethrough, task lists) but not custom React components.

4. **Map fields to Dev.to API**:

   | MDX frontmatter | Dev.to API field |
   |----------------|-----------------|
   | `title` | `article.title` |
   | `summary` | `article.description` (truncate to 200 chars) |
   | `tags[0..3]` | `article.tags` (max 4, lowercase, no special chars) |
   | `image` | `article.main_image` |
   | slug → `https://flabs.tech/blog/{slug}` | `article.canonical_url` |
   | — | `article.published: true` |

5. **Call the API** — use `createArticle()` from `@/lib/devto` for new posts, `updateArticle()` for existing ones. The `DEVTO_API_KEY` environment variable must be set (generate at https://dev.to/settings/account).

6. **Track state** — after a successful POST, write `devtoId: <returned_id>` into the MDX file's frontmatter so future updates use PUT. This field is defined in the `Metadata` type (`src/lib/mdx.ts`).

7. **Handle errors** — if the API returns 401 (bad key), abort and log. If 422 (validation error), log the response body for debugging. If 429 (rate limited), wait and retry. On any failure, the post remains in the portfolio — the cross-post is optional, the canonical source is not.

**Pre-commit flow** (preferred for new posts):
```bash
# After committing a new blog post to a feature branch:
npx agenthood run the-herald "cross-post src/content/blog/my-new-post.mdx --dry-run"

# Without --dry-run, it posts to Dev.to:
npx agenthood run the-herald "cross-post src/content/blog/my-new-post.mdx"
```

**CI flow** (for automated cross-posting on merge):
A GitHub Action (`.github/workflows/cross-post.yml`) watches for merged PRs that touch `src/content/blog/*.mdx` and invokes the same process with the `DEVTO_API_KEY` secret.

### Morning Standup Report

Generated at 8:00 AM from git activity since yesterday:

```markdown
## Morning Briefing — {Date}

### Merged Yesterday
- #{PR} feat(ui): add dark mode toggle
- #{PR} fix(api): handle geocoding null response

### Open PRs Awaiting Review
- #{PR} feat(auth): add OAuth2 login (2 days open)

### In Progress (branches with recent commits)
- fix/issue-102-login-redirect (last commit 3h ago)

### ⚠️ Attention
- Branch feat/old-experiment has not been updated in 5 days
- 14 uncommitted changes in src/components/Map.tsx (2h idle)
```

### End of Day Summary

Generated at end of working session:

```markdown
## End of Day — {Date}

### Completed
- Closed #{issue} — fix login redirect loop
- Merged #{PR} — feat(ui): dark mode toggle

### In Progress
- #{issue} — OAuth2 integration (spec written, implementation 40%)

### Tomorrow
- Complete OAuth2 implementation
- Review #{PR} from teammate
```

## Red Flags

- A release with no changelog entry
- A version bump that doesn't match the commit types present
- `CHANGELOG.md` last updated more than 2 releases ago
- A GitHub Release with no description
- PRs open for more than 3 days without review
- A blog post merged to main with no `devtoId` in frontmatter — it was never cross-posted
- A blog post with `devtoId` but stale content — the Dev.to copy is out of sync
- Cross-posting a post whose title starts with "Index" or "Overview" — these are listing pages, not articles

## Rationalizations

| What you think | What The Herald knows |
|---------------|----------------------|
| "Everyone knows what changed" | Nobody reads commits. People read changelogs. Write the changelog. |
| "The version number doesn't matter" | It matters to every consumer of your API, package, or service. |
| "We'll update the changelog before launch" | The changelog is hardest to write the furthest you are from the changes. Write it as you go. |
| "My portfolio blog is enough — people will find it" | A personal domain has zero discovery. Dev.to has 1M+ monthly active developers. Cross-posting is how content gets found. |
| "Cross-posting is extra work" | It's a script. Or a GitHub Action. Or a one-line `agenthood run` command. The work is writing the post — distribution should be automated. |
| "I'll cross-post after the PR merges" | After merge, there is no context. Do it in the PR branch while the post is fresh. The `devtoId` travels with the frontmatter. |

## Verification

Before a release:

- [ ] Version bump is correct for the commit types present
- [ ] CHANGELOG.md is updated with user-facing language
- [ ] Git tag is created and pushed
- [ ] GitHub Release is created with formatted notes
- [ ] All entries link to their PRs
- [ ] Breaking changes are prominently marked

Before merging a branch with blog changes:

- [ ] Each new blog post in `src/content/blog/*.mdx` has been cross-posted to Dev.to
- [ ] Each cross-posted blog post has a `devtoId` in its frontmatter
- [ ] `DEVTO_API_KEY` is set in the deployment environment (or at least in `.env` locally for manual runs)
- [ ] The `canonical_url` on Dev.to points to `https://flabs.tech/blog/{slug}`
- [ ] Index or overview pages (title starts with "Index" or "Overview") are NOT cross-posted
