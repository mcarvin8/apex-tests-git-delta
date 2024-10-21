'use strict';

import { rm } from 'node:fs/promises';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/atgd/delta.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('atgd unit test - warnings', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let fromSha: string;
  let toSha: string;
  let tempDir: string;
  const originalDir = process.cwd();

  before(async () => {
    tempDir = await setupTestRepo();

    fromSha = await createTemporaryCommit(
      'chore: initial commit with Apex::TestClass00::Apex',
      'SandboxTest.cls',
      'dummy 1'
    );
    await createTemporaryCommit('chore: initial commit with Apex::SandboxTest::Apex', 'TestClass3.cls', 'dummy 11');
    toSha = await createTemporaryCommit(
      'chore: adding new tests Apex::TestClass3 TestClass4::Apex',
      'TestClass4.cls',
      'dummy 2'
    );
  });

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  after(async () => {
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true });
  });

  it('confirm warnings are generated and no delta tests are in the log output.', async () => {
    await ApexTestDelta.run(['--from', fromSha, '--to', toSha]);
    const warningsOutput = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    const warningsNotEmpty = warningsOutput.trim().length > 0;
    expect(warningsNotEmpty).to.be.true;
    const logOutput = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(logOutput).to.include('');
  });
});
