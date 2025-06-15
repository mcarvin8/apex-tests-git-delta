'use strict';

import { rm } from 'node:fs/promises';
import { describe, it, expect } from '@jest/globals';

import { extractTestClasses } from '../../../src/service/extractTestClasses.js';
import { gitAdapter } from '../../../src/service/gitAdapter.js';
import { createTemporaryCommit } from '../../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../../utils/setupTestRepo.js';

describe('atgd unit test', () => {
  let tempDir: string;
  const originalDir = process.cwd();

  beforeAll(async () => {
    tempDir = await setupTestRepo();
    const git = gitAdapter();
    await createTemporaryCommit(
      'chore: commit with Apex::TestClass00::Apex',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1',
      git
    );
    await createTemporaryCommit(
      'chore: 2nd commit with Apex::SandboxTest::Apex',
      'force-app/main/default/classes/TestClass3.cls',
      'dummy 11',
      git
    );
    await createTemporaryCommit(
      'chore: adding new tests Apex::TestClass3 TestClass4::Apex',
      'packaged/classes/TestClass4.cls',
      'dummy 2',
      git
    );
    await createTemporaryCommit('chore: add some tests', 'packaged/classes/TestClass4.cls', 'dummy 2222', git);
    await createTemporaryCommit(
      'chore: adding new tests Apex::  TestClass33   ::Apex',
      'TestClass4.cls',
      'dummy 22',
      git
    );
    await createTemporaryCommit('chore: adding new tests Apex::TestClass33::Apex', 'TestClass4.cls', 'dummy 2', git);
  });

  afterAll(async () => {
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true });
  });

  it('return tests without any warnings.', async () => {
    const result = await extractTestClasses('HEAD~5', 'HEAD~3', false);
    expect(result.validatedClasses).toEqual('SandboxTest TestClass3 TestClass4');
  });
  it('return no tests without warnings.', async () => {
    const result = await extractTestClasses('HEAD~3', 'HEAD~2', false);
    expect(result.validatedClasses).toEqual('');
  });
  it('return no test with warnings.', async () => {
    const result = await extractTestClasses('HEAD~2', 'HEAD~1', false);
    expect(result.validatedClasses).toEqual('');
  });
  it('skip validation and return tests without warnings', async () => {
    const result = await extractTestClasses('HEAD~1', 'HEAD', true);
    expect(result.validatedClasses).toEqual('TestClass33');
  });
});
