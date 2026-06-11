'use strict';

import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Repository } from '@scolladon/tsgit';

import { extractTestClasses } from '../../src/service/extractTestClasses.js';
import { createTemporaryCommit } from '../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../utils/setupTestRepo.js';
import { regExFile } from '../utils/testConstants.js';

describe('atgd unit test', () => {
  let tempDir: string;
  let repo: Repository;
  let regExFilePath: string;

  beforeAll(async () => {
    ({ tempDir, repo } = await setupTestRepo());
    await createTemporaryCommit(
      'chore: commit with Apex::::Apex',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1',
      repo,
      tempDir,
    );
    await createTemporaryCommit(
      'chore: 2nd commit with Apex::::Apex',
      'force-app/main/default/classes/TestClass3.cls',
      'dummy 11',
      repo,
      tempDir,
    );
    regExFilePath = join(tempDir, regExFile);
    await rm(regExFilePath);
  });

  afterAll(async () => {
    await repo.dispose();
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('return tests without any warnings.', async () => {
    await expect(extractTestClasses('HEAD~1', 'HEAD', false, tempDir)).rejects.toThrow(
      `The regular expression in '${regExFilePath}' is invalid or the file wasn't found in the repo root folder.`,
    );
  });
});
