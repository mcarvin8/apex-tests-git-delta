'use strict';

import { rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { vi, describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Repository } from '@scolladon/tsgit';

vi.mock('../../src/service/gitAdapter.js', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../../src/service/gitAdapter.js')>();
  return { ...mod, readBlobAtCommitPath: vi.fn(mod.readBlobAtCommitPath) };
});

import { resolveTestSuites } from '../../src/service/resolveTestSuites.js';
import * as gitAdapter from '../../src/service/gitAdapter.js';
import { createTemporaryCommit } from '../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../utils/setupTestRepo.js';

const suiteXml = (): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ApexTestSuite xmlns="http://soap.sforce.com/2006/04/metadata">',
    '    <testClassName>SomeTest</testClassName>',
    '</ApexTestSuite>',
    '',
  ].join('\n');

describe('resolveTestSuites blob-read failure', () => {
  let tempDir: string;
  let repo: Repository;

  beforeAll(async () => {
    ({ tempDir, repo } = await setupTestRepo());
    await mkdir(join(tempDir, 'force-app/main/default/testSuites'), { recursive: true });
    await createTemporaryCommit(
      'chore: add suite',
      'force-app/main/default/testSuites/BlobFailSuite.testSuite-meta.xml',
      suiteXml(),
      repo,
      tempDir,
    );
  });

  afterAll(async () => {
    await repo.dispose();
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('warns when suite file blob cannot be read', async () => {
    vi.mocked(gitAdapter.readBlobAtCommitPath).mockResolvedValueOnce(null);
    const result = await resolveTestSuites(['BlobFailSuite'], 'HEAD', tempDir, repo);
    expect(result.resolvedSuites).toEqual([]);
    expect(result.warnings.some((w) => w.includes('BlobFailSuite') && w.includes('could not be read'))).toBe(true);
  });
});
