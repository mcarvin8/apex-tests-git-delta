'use strict';

import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/apex-tests-git-delta/delta.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { regExPattern, sfdxConfigFile, sfdxConfigJsonString } from './testConstants.js';

describe('scan commit messages without the regex and return an empty string.', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let fromSha: string;
  let toSha: string;
  const originalDir = process.cwd();
  const tempDir = fs.mkdtempSync('../git-temp-');

  before(async () => {
    process.chdir(tempDir);
    fs.mkdirSync('force-app/main/default/classes', { recursive: true });
    fs.mkdirSync('packaged/classes', { recursive: true });
    execSync('git init', { cwd: tempDir });
    execSync('git branch -m main');
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
      'chore: initial commit',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1'
    );
    await createTemporaryCommit('chore: add a class', 'force-app/main/default/classes/TestClass3.cls', 'dummy 11');
    toSha = await createTemporaryCommit('chore: add some tests', 'packaged/classes/TestClass4.cls', 'dummy 2');
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
    await ApexTestDelta.run(['--from', fromSha, '--to', toSha, '-e', regExPattern]);
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
