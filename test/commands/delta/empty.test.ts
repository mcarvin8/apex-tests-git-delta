'use strict';

import { rm } from 'node:fs/promises';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/atgd/delta.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('atgd unit test - empty string', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let fromSha: string;
  let toSha: string;
  let tempDir: string;
  const originalDir = process.cwd();

  before(async () => {
    tempDir = await setupTestRepo();

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
