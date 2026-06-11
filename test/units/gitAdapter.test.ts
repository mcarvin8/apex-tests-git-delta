'use strict';

import { describe, it, expect } from 'vitest';

import { openRepo, listFilesAtCommit, readBlobAtCommitPath } from '../../src/service/gitAdapter.js';

const NONEXISTENT_SHA = '0000000000000000000000000000000000000001';

describe('openRepo', () => {
  it('defaults baseDir to process.cwd() when no argument provided', async () => {
    const repo = await openRepo();
    const root = repo.primitives.getRepoRoot();
    expect(root).toBeTruthy();
    await repo.dispose();
  });
});

describe('listFilesAtCommit', () => {
  it('returns empty array when commit object does not exist', async () => {
    const repo = await openRepo();
    const files = await listFilesAtCommit(repo, NONEXISTENT_SHA, 'src');
    expect(files).toEqual([]);
    await repo.dispose();
  });
});

describe('readBlobAtCommitPath', () => {
  it('returns null when commit object does not exist', async () => {
    const repo = await openRepo();
    const content = await readBlobAtCommitPath(repo, NONEXISTENT_SHA, 'src/index.ts');
    expect(content).toBeNull();
    await repo.dispose();
  });
});
