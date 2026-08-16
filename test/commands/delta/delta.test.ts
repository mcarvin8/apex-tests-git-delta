'use strict';

import { rm } from 'node:fs/promises';
import type { Repository } from '@scolladon/tsgit';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { extractTestClasses } from '../../../src/service/extractTestClasses.js';
import { createTemporaryCommit } from '../../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../../utils/setupTestRepo.js';

describe('atgd unit test', () => {
  let tempDir: string;
  let repo: Repository;

  beforeAll(async () => {
    ({ tempDir, repo } = await setupTestRepo());
    await createTemporaryCommit(
      'chore: commit with Apex::TestClass00::Apex',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1',
      repo,
      tempDir,
    );
    await createTemporaryCommit(
      'chore: 2nd commit with Apex::SandboxTest::Apex',
      'force-app/main/default/classes/TestClass3.cls',
      'dummy 11',
      repo,
      tempDir,
    );
    await createTemporaryCommit(
      'chore: adding new tests Apex::TestClass3 TestClass4::Apex',
      'packaged/classes/TestClass4.cls',
      'dummy 2',
      repo,
      tempDir,
    );
    await createTemporaryCommit(
      'chore: add some tests',
      'packaged/classes/TestClass4.cls',
      'dummy 2222',
      repo,
      tempDir,
    );
    await createTemporaryCommit(
      'chore: adding new tests Apex::  TestClass33   ::Apex',
      'TestClass4.cls',
      'dummy 22',
      repo,
      tempDir,
    );
    await createTemporaryCommit(
      'chore: adding new tests Apex::TestClass33::Apex',
      'TestClass4.cls',
      'dummy 2',
      repo,
      tempDir,
    );
  });

  afterAll(async () => {
    await repo.dispose();
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('return tests without any warnings.', async () => {
    const result = await extractTestClasses('HEAD~5', 'HEAD~3', false, false, tempDir);
    expect(result.validatedClasses).toEqual('SandboxTest TestClass3 TestClass4');
  });
  it('return no tests without warnings.', async () => {
    const result = await extractTestClasses('HEAD~3', 'HEAD~2', false, false, tempDir);
    expect(result.validatedClasses).toEqual('');
  });
  it('return no test with warnings.', async () => {
    const result = await extractTestClasses('HEAD~2', 'HEAD~1', false, false, tempDir);
    expect(result.validatedClasses).toEqual('');
  });
  it('skip validation and return tests without warnings', async () => {
    const result = await extractTestClasses('HEAD~1', 'HEAD', true, false, tempDir);
    expect(result.validatedClasses).toEqual('TestClass33');
  });
});

describe('atgd merge-base flag', () => {
  let tempDir: string;
  let repo: Repository;

  beforeAll(async () => {
    ({ tempDir, repo } = await setupTestRepo());
    const baseHash = await createTemporaryCommit(
      'chore: base commit',
      'force-app/main/default/classes/Base.cls',
      'dummy base',
      repo,
      tempDir,
    );
    await repo.branch.create({ name: 'feature', startPoint: baseHash });
    await repo.checkout({ rev: 'feature' });
    await createTemporaryCommit(
      'chore: commit with Apex::FeatureTest::Apex',
      'force-app/main/default/classes/FeatureTest.cls',
      'dummy feature',
      repo,
      tempDir,
    );
    await repo.checkout({ rev: baseHash, detach: true });
    await createTemporaryCommit(
      'chore: commit with Apex::MainTest::Apex',
      'force-app/main/default/classes/MainTest.cls',
      'dummy main',
      repo,
      tempDir,
    );
  });

  afterAll(async () => {
    await repo.dispose();
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('resolves --from as the merge base of --to and --from', async () => {
    const result = await extractTestClasses('feature', 'HEAD', true, true, tempDir);
    expect(result.validatedClasses).toEqual('MainTest');
  });
});
