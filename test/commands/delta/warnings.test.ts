'use strict';

import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/apex-tests-git-delta/delta.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { regExFile, regExFileContents, sfdxConfigFile, sfdxConfigJsonString } from './testConstants.js';

describe('confirm warnings are generated when files cannot be found in a package directory.', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let fromSha: string;
  let toSha: string;
  const originalDir = process.cwd();
  const tempDir = mkdtempSync('../git-temp-');

  before(async () => {
    process.chdir(tempDir);
    const options: Partial<SimpleGitOptions> = {
      baseDir: process.cwd(),
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    await mkdir('force-app/main/default/classes', { recursive: true });
    await mkdir('packaged/classes', { recursive: true });
    await git.init();
    await writeFile(regExFile, regExFileContents);
    await writeFile(sfdxConfigFile, sfdxConfigJsonString);
    let userName;
    let userEmail;

    try {
      userName = await git.getConfig('user.name');
      userEmail = await git.getConfig('user.email');
    } catch (error) {
      // Ignore errors if the git config values are not set
    }
    if (!userName?.value && !userEmail?.value) {
      await git.addConfig('user.name', 'CI Bot', false, 'global');
      await git.addConfig('user.email', '90224411+mcarvin8@users.noreply.github.com', false, 'global');
    }
    fromSha = await createTemporaryCommit(
      'chore: initial commit with Apex::TestClass00::Apex',
      'SandboxTest.cls',
      'dummy 1',
      git
    );
    await createTemporaryCommit(
      'chore: initial commit with Apex::SandboxTest::Apex',
      'TestClass3.cls',
      'dummy 11',
      git
    );
    toSha = await createTemporaryCommit(
      'chore: adding new tests Apex::TestClass3 TestClass4::Apex',
      'TestClass4.cls',
      'dummy 2',
      git
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
