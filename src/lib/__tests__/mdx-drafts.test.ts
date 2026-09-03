import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { getPosts } from '../mdx';

// Real-filesystem coverage for draft filtering. This lives in its own file
// because mdx.test.ts mocks `node:fs` (and its gray-matter automock parses
// `draft: true` as a string, so the filter cannot be exercised there).
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mdx-drafts-'));
fs.writeFileSync(
  path.join(tmpRoot, 'pub.mdx'),
  '---\ntitle: Pub\npublishedAt: 2025-01-01\n---\n\nP',
);
fs.writeFileSync(
  path.join(tmpRoot, 'wip.mdx'),
  '---\ntitle: WIP\ndraft: true\npublishedAt: 2025-01-01\n---\n\nW',
);
// getPosts joins onto process.cwd(), so reach the temp dir via a relative path.
const relSegments = path.relative(process.cwd(), tmpRoot).split(path.sep);

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('getPosts draft filtering', () => {
  it('includes drafts by default (admin/public callers narrow down themselves)', () => {
    expect(getPosts(relSegments).map((p) => p.slug).sort()).toEqual(['pub', 'wip']);
  });

  it('excludes drafts when includeDrafts is false (AI assistant, search)', () => {
    expect(getPosts(relSegments, false).map((p) => p.slug)).toEqual(['pub']);
  });
});
