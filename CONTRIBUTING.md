# Contributing to flabs.tech

Short version — the full conventions live in [AGENTS.md](AGENTS.md).

## Workflow

1. Open an issue first describing the change.
2. Create a branch: `<type>/<issue-number>-<slug>` (e.g. `feat/131-dark-mode`).
3. Make changes with [Conventional Commits](https://www.conventionalcommits.org/) (enforced by commitlint via `.githooks/`; direct commits to `main` are blocked).
4. Open a PR using the template at [.github/pull_request_template.md](.github/pull_request_template.md) — link the issue with `Closes #N`.

## Before you push

```sh
npm run lint
npm run typecheck
npm test
```

CI runs lint → typecheck → test → e2e → Lighthouse; all must pass before merge.

## Docs that must stay in sync

- `README.md` — features, stack, commands, project structure
- `AGENTS.md` — agent commands, architecture, conventions
- `.env.example` — every env var the app reads
- [`docs/blog-post-pattern.md`](docs/blog-post-pattern.md) — rules for new blog posts (blocking checklist)
