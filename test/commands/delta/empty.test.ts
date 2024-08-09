'use strict';

import { promises as fsPromises, readFile, stat, readdir, mkdtempSync } from 'node:fs';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import git from 'isomorphic-git';

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
  const tempDir = mkdtempSync('../git-temp-');
  const fs = { promises: fsPromises, readFile, stat, readdir };

  before(async () => {
    process.chdir(tempDir);

    await mkdir('force-app/main/default/classes', { recursive: true });
    await mkdir('packaged/classes', { recursive: true });
    await git.init({ fs, dir: tempDir });
    await writeFile(regExFile, regExFileContents);
    await writeFile(sfdxConfigFile, sfdxConfigJsonString);

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

  after(async () => {
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true });
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
