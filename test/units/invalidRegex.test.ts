'use strict';

import { rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, it, expect } from '@jest/globals';

import { extractTestClasses } from '../../src/service/extractTestClasses.js';
import { gitAdapter } from '../../src/service/gitAdapter.js';
import { createTemporaryCommit } from '../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../utils/setupTestRepo.js';
import { regExFile } from '../utils/testConstants.js';

describe('atgd unit test', () => {
  let tempDir: string;
  let regExFilePath: string;
  const originalDir = process.cwd();

  beforeAll(async () => {
    tempDir = await setupTestRepo();
    const git = gitAdapter();
    await createTemporaryCommit(
      'chore: commit with Apex::::Apex',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1',
      git
    );
    await createTemporaryCommit(
      'chore: 2nd commit with Apex::::Apex',
      'force-app/main/default/classes/TestClass3.cls',
      'dummy 11',
      git
    );
    regExFilePath = resolve(regExFile);
    await rm(regExFilePath);
  });

  afterAll(async () => {
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true });
  });

  it('return tests without any warnings.', async () => {
    await expect(extractTestClasses('HEAD~1', 'HEAD', false)).rejects.toThrow(
      `The regular expression in '${regExFilePath}' is invalid or the file wasn't found in the repo root folder.`
    );
  });
});
