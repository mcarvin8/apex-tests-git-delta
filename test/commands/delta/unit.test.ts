import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/apex-tests-git-delta/delta.js';

// Utility function to create temporary Git commits
async function createTemporaryCommit(message: string, content: string): Promise<string> {
  // Create a temporary file
  const tempFilePath = 'temp.txt';
  await fs.promises.writeFile(tempFilePath, content);

  // Stage the file
  execSync('git add temp.txt');

  // Commit with the provided message
  execSync(`git commit -m "${message}"`);

  // Return the commit hash of the newly created commit
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  
  return commitHash;
}

describe('return the delta tests between git commits', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let fromSha: string;
  let toSha: string;

  before(async () => {
    execSync('git config --global user.name "CI Bot"');
    execSync('git config --global user.email "90224411+mcarvin8@users.noreply.github.com"');
    fromSha = await createTemporaryCommit('chore: initial commit with Apex::TestClass00::Apex', 'dummy 1');
    await createTemporaryCommit('chore: initial commit with Apex::SandboxTest::Apex', 'dummy 11');
    toSha = await createTemporaryCommit('chore: adding new tests Apex::TestClass3 TestClass4::Apex', 'dummy 2');
  });

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  after(() => {
    execSync('git reset --hard HEAD~3');
    execSync('git clean -fd');
  });

  it('scan the temporary commits and return the delta test class string.', async () => {
    await ApexTestDelta.run(['--from', fromSha, '--to', toSha]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('SandboxTest TestClass00 TestClass3 TestClass4');
  });
});
