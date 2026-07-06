'use strict';

import { rm } from 'node:fs/promises';
import type { Repository } from '@scolladon/tsgit';
import { afterEach, describe, expect, it } from 'vitest';

import { listFilesAtCommit, openRepo, readBlobAtCommitPath } from '../../src/service/gitAdapter.js';
import { createTemporaryCommit } from '../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../utils/setupTestRepo.js';

const NONEXISTENT_SHA = '0000000000000000000000000000000000000001';
const CLASS_PATH = 'force-app/main/default/classes/Foo.cls';
const CLASS_BODY = 'public class Foo {}';

let tempDir: string | undefined;
let repo: Repository | undefined;

afterEach(async () => {
  if (repo) {
    await repo.dispose();
    repo = undefined;
  }
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    tempDir = undefined;
  }
});

describe('openRepo', () => {
  it('defaults baseDir to process.cwd() when no argument provided', async () => {
    repo = await openRepo();
    const root = repo.primitives.getRepoRoot();
    expect(root).toBeTruthy();
  });
});

describe('listFilesAtCommit', () => {
  it('returns empty array when commit object does not exist', async () => {
    repo = await openRepo();
    const files = await listFilesAtCommit(repo, NONEXISTENT_SHA, 'src');
    expect(files).toEqual([]);
  });

  it('returns empty array when the resolved object is not a commit', async () => {
    ({ tempDir, repo } = await setupTestRepo());
    const commitHash = await createTemporaryCommit('chore: add class', CLASS_PATH, CLASS_BODY, repo, tempDir);
    const commitOid = await repo.revParse(commitHash);
    const commitObj = await repo.primitives.readObject(commitOid);
    if (commitObj.type !== 'commit') throw new Error('expected commit object');
    const treeOid = commitObj.data.tree;

    const files = await listFilesAtCommit(repo, treeOid, 'force-app');
    expect(files).toEqual([]);
  });
});

describe('readBlobAtCommitPath', () => {
  it('returns null when commit object does not exist', async () => {
    repo = await openRepo();
    const content = await readBlobAtCommitPath(repo, NONEXISTENT_SHA, 'src/index.ts');
    expect(content).toBeNull();
  });

  it('returns null when the resolved object is not a commit', async () => {
    ({ tempDir, repo } = await setupTestRepo());
    const commitHash = await createTemporaryCommit('chore: add class', CLASS_PATH, CLASS_BODY, repo, tempDir);
    const commitOid = await repo.revParse(commitHash);
    const commitObj = await repo.primitives.readObject(commitOid);
    if (commitObj.type !== 'commit') throw new Error('expected commit object');
    const treeOid = commitObj.data.tree;

    const content = await readBlobAtCommitPath(repo, treeOid, CLASS_PATH);
    expect(content).toBeNull();
  });

  it('returns null when an intermediate directory segment is missing', async () => {
    ({ tempDir, repo } = await setupTestRepo());
    const commitHash = await createTemporaryCommit('chore: add class', CLASS_PATH, CLASS_BODY, repo, tempDir);

    const content = await readBlobAtCommitPath(repo, commitHash, 'does-not-exist/Foo.cls');
    expect(content).toBeNull();
  });

  it('returns null when the file is missing from the final directory', async () => {
    ({ tempDir, repo } = await setupTestRepo());
    const commitHash = await createTemporaryCommit('chore: add class', CLASS_PATH, CLASS_BODY, repo, tempDir);

    const content = await readBlobAtCommitPath(repo, commitHash, 'force-app/main/default/classes/Missing.cls');
    expect(content).toBeNull();
  });

  it('returns the blob content for a valid nested path at a commit', async () => {
    ({ tempDir, repo } = await setupTestRepo());
    const commitHash = await createTemporaryCommit('chore: add class', CLASS_PATH, CLASS_BODY, repo, tempDir);

    const content = await readBlobAtCommitPath(repo, commitHash, CLASS_PATH);
    expect(content).not.toBeNull();
    expect(Buffer.from(content as Uint8Array).toString('utf8')).toBe(CLASS_BODY);
  });
});
