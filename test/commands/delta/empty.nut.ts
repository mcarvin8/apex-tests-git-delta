'use strict';

import { rm } from 'node:fs/promises';

import { execCmd, TestSession } from '@salesforce/cli-plugins-testkit';
import { expect } from 'chai';

import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('apex-tests-git-delta empty string NUT', () => {
  let session: TestSession;
  let fromSha: string;
  let toSha: string;
  let tempDir: string;
  const originalDir = process.cwd();

  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'NONE' });
    tempDir = await setupTestRepo();
    fromSha = await createTemporaryCommit(
      'chore: initial commit',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1'
    );
    await createTemporaryCommit('chore: add a class', 'force-app/main/default/classes/TestClass3.cls', 'dummy 11');
    toSha = await createTemporaryCommit('chore: add some tests', 'packaged/classes/TestClass4.cls', 'dummy 2');
  });

  after(async () => {
    await session?.clean();
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true });
  });

  it('runs delta command and returns no tests.', async () => {
    const command = `apex-tests-git-delta delta --from "${fromSha}" --to "${toSha}"`;
    const output = execCmd(command, { ensureExitCode: 0 }).shellOutput.stdout;

    expect(output.replace('\n', '')).to.equal('');
  });
});
