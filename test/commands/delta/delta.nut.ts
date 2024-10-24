'use strict';

import { rm } from 'node:fs/promises';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('atgd NUTs', () => {
  let session: TestSession;
  let tempDir: string;
  const originalDir = process.cwd();

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
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

  after(async () => {
    await session?.clean();
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true });
  });

  it('runs delta command and returns the tests.', async () => {
    const command = 'atgd delta --from "HEAD~2" --to "HEAD"';
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal('SandboxTest TestClass3 TestClass4');
  });
});
