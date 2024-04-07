'use strict';

import * as fs from 'node:fs';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/apex-tests-git-delta/delta.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { regExFile, regExFileContents, sfdxConfigFile, sfdxConfigJsonString } from './testConstants.js';

describe('scan commit messages without the regex and return an empty string.', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let fromSha: string;
  let toSha: string;
  const originalDir = process.cwd();
  const tempDir = fs.mkdtempSync('../git-temp-');

  before(async () => {
    process.chdir(tempDir);
    const options: Partial<SimpleGitOptions> = {
      baseDir: process.cwd(),
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
    };
    const git: SimpleGit = simpleGit(options);
    fs.mkdirSync('force-app/main/default/classes', { recursive: true });
    fs.mkdirSync('packaged/classes', { recursive: true });
    await git.init();
    fs.writeFileSync(regExFile, regExFileContents);
    fs.writeFileSync(sfdxConfigFile, sfdxConfigJsonString);
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
      'chore: initial commit',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1',
      git
    );
    await createTemporaryCommit('chore: add a class', 'force-app/main/default/classes/TestClass3.cls', 'dummy 11', git);
    toSha = await createTemporaryCommit('chore: add some tests', 'packaged/classes/TestClass4.cls', 'dummy 2', git);
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

  it('return an empty test string with no warnings.', async () => {
    await ApexTestDelta.run(['--from', fromSha, '--to', toSha]);
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
});
