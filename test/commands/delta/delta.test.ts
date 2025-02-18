'use strict';

import { rm } from 'node:fs/promises';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/atgd/delta.js';
import { gitAdapter } from '../../../src/service/gitAdapter.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('atgd unit test', () => {
  const $$ = new TestContext();
  let tempDir: string;
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  const originalDir = process.cwd();

  before(async () => {
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
    await createTemporaryCommit('chore: adding new tests Apex::TestClass33::Apex', 'TestClass4.cls', 'dummy 22', git);
    await createTemporaryCommit('chore: adding new tests Apex::TestClass33::Apex', 'TestClass4.cls', 'dummy 2', git);
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

  it('return tests without any warnings.', async () => {
    await ApexTestDelta.run(['--from', 'HEAD~5', '--to', 'HEAD~3']);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('SandboxTest TestClass3 TestClass4');
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('return no tests without warnings.', async () => {
    await ApexTestDelta.run(['--from', 'HEAD~3', '--to', 'HEAD~2']);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('');
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
  it('return no test with warnings.', async () => {
    await ApexTestDelta.run(['--from', 'HEAD~2', '--to', 'HEAD~1']);
    const logOutput = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(logOutput).to.include('');
  });
  it('skip validation and return tests without warnings', async () => {
    await ApexTestDelta.run(['--from', 'HEAD~1', '--skip-test-validation']);
    const logOutput = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(logOutput).to.include('TestClass33');
  });
});
