import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/apex-tests-git-delta/delta.js';

// Utility function to create temporary Git commits
async function createTemporaryCommit(message: string, filePath: string, content: string): Promise<string> {
  await fs.promises.writeFile(filePath, content);

  // Stage the file
  execSync(`git add "${filePath}"`);

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
  const regExFile: string = 'regex.txt';
  const regExFileContents: string = '[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]';
  const originalDir = process.cwd();
  const sfdxConfigFile = 'sfdx-project.json';
  const sfdxConfigFileContents = {
    packageDirectories: [{ path: 'force-app', default: true }, { path: 'packaged' }],
    namespace: '',
    sfdcLoginUrl: 'https://login.salesforce.com',
    sourceApiVersion: '58.0',
  };
  const sfdxConfigJsonString = JSON.stringify(sfdxConfigFileContents, null, 2);
  const tempDir = fs.mkdtempSync('../git-temp-');

  before(async () => {
    process.chdir(tempDir);
    fs.mkdirSync('force-app/main/default/classes', { recursive: true });
    fs.mkdirSync('packaged/classes', { recursive: true });
    execSync('git init', { cwd: tempDir });
    execSync('git branch -m main');
    fs.writeFileSync(regExFile, regExFileContents);
    fs.writeFileSync(sfdxConfigFile, sfdxConfigJsonString);
    let userName = '';
    let userEmail = '';

    try {
      userName = execSync('git config --global user.name', { encoding: 'utf-8' }).trim();
      userEmail = execSync('git config --global user.email', { encoding: 'utf-8' }).trim();
    } catch (error) {
      // Ignore errors if the git config values are not set
    }

    if (userName === '' && userEmail === '') {
      execSync('git config --global user.name "CI Bot"');
      execSync('git config --global user.email "90224411+mcarvin8@users.noreply.github.com"');
    }
    fromSha = await createTemporaryCommit(
      'chore: initial commit with Apex::TestClass00::Apex',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1'
    );
    await createTemporaryCommit(
      'chore: initial commit with Apex::SandboxTest::Apex',
      'force-app/main/default/classes/TestClass3.cls',
      'dummy 11'
    );
    toSha = await createTemporaryCommit(
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

  after(() => {
    process.chdir(originalDir);
    fs.rmdirSync(tempDir, { recursive: true });
  });

  it('scan the temporary commits and return the delta test class string.', async () => {
    await ApexTestDelta.run(['--from', fromSha, '--to', toSha]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('SandboxTest TestClass3 TestClass4');
  });
});
