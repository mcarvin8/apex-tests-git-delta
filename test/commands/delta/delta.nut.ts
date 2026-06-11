'use strict';

import { rm } from 'node:fs/promises';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import type { Repository } from '@scolladon/tsgit';

import { createTemporaryCommit } from '../../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../../utils/setupTestRepo.js';

describe('atgd NUTs', () => {
  let session: TestSession;
  let tempDir: string;
  let repo: Repository;
  const originalDir = process.cwd();

  beforeAll(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    ({ tempDir, repo } = await setupTestRepo());
    process.chdir(tempDir);
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
      'chore: adding new tests Apex::TestClass33::Apex',
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
    await session?.clean();
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('return tests without any warnings.', async () => {
    const command = 'atgd delta --from "HEAD~5" --to "HEAD~3"';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).toEqual('SandboxTest TestClass3 TestClass4');
  });
  it('return no tests.', async () => {
    const command = 'atgd delta --from "HEAD~3" --to "HEAD~2"';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).toEqual('');
  });
  it('skip validation and return tests without warnings', async () => {
    const command = 'atgd delta --from "HEAD~1" --skip-test-validation';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output.replace('\n', '')).toEqual('TestClass33');
  });
  it('return tests in sf format', async () => {
    const command = 'atgd delta --from "HEAD~5" --to "HEAD~3" --format sf';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output.replace('\n', '')).toEqual('--tests SandboxTest --tests TestClass3 --tests TestClass4');
  });
});
