'use strict';

import { rm } from 'node:fs/promises';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/atgd/delta.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('atgd unit test', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let tempDir: string;
  const originalDir = process.cwd();

  before(async () => {
    tempDir = await setupTestRepo();

    await createTemporaryCommit(
      'chore: initial commit with Apex::TestClass00::Apex',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1'
    );
    await createTemporaryCommit(
      'chore: initial commit with Apex::SandboxTest::Apex',
      'force-app/main/default/classes/TestClass3.cls',
      'dummy 11'
    );
    await createTemporaryCommit(
      'chore: adding new tests Apex::TestClass3 TestClass4::Apex',
      'packaged/classes/TestClass4.cls',
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

  it('return tests without any warnings.', async () => {
    await ApexTestDelta.run(['--from', 'HEAD~2', '--to', 'HEAD']);
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
    await createTemporaryCommit('chore: add some tests', 'packaged/classes/TestClass4.cls', 'dummy 2');
    await ApexTestDelta.run(['--from', 'HEAD~1']);
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
    await createTemporaryCommit('chore: adding new tests Apex::TestClass33::Apex', 'TestClass4.cls', 'dummy 2');
    await ApexTestDelta.run(['--from', 'HEAD~1']);
    const logOutput = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(logOutput).to.include('');
  });
  it('skip validation and return tests without warnings', async () => {
    await createTemporaryCommit('chore: adding new tests Apex::TestClass33::Apex', 'TestClass4.cls', 'dummy 2');
    await ApexTestDelta.run(['--from', 'HEAD~1', '--skip-test-validation']);
    const logOutput = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(logOutput).to.include('TestClass33');
  });
});
