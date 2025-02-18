'use strict';

import { rm } from 'node:fs/promises';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

import { gitAdapter } from '../../../src/service/gitAdapter.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('atgd NUTs', () => {
  let session: TestSession;
  let tempDir: string;
  const originalDir = process.cwd();

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
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

  after(async () => {
    await session?.clean();
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true });
  });

  it('return tests without any warnings.', async () => {
    const command = 'atgd delta --from "HEAD~5" --to "HEAD~3"';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal('SandboxTest TestClass3 TestClass4');
  });
  it('return no tests.', async () => {
    const command = 'atgd delta --from "HEAD~3" --to "HEAD~2"';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal('');
  });
  it('skip validation and return tests without warnings', async () => {
    const command = 'atgd delta --from "HEAD~1" --skip-test-validation';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;
    expect(output.replace('\n', '')).to.equal('TestClass33');
  });
});
