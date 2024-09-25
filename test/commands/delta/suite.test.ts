'use strict';

import { rm } from 'node:fs/promises';

import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import ApexTestDelta from '../../../src/commands/apex-tests-git-delta/delta.js';
import { createTemporaryCommit } from './createTemporaryCommit.js';
import { setupTestRepo } from './setupTestRepo.js';

describe('test suite', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;
  let tempDir: string;
  const originalDir = process.cwd();

  before(async () => {
    tempDir = await setupTestRepo();

    // Create an initial commit with a basic test class
    await createTemporaryCommit(
      'chore: initial commit with Apex::SandboxTest::Apex',
      'force-app/main/default/classes/SandboxTest.cls',
      'dummy 1'
    );

    // Create another commit with a test suite referencing multiple test classes
    await createTemporaryCommit(
      'chore: add test suite Apex::SampleSuite::Apex',
      'force-app/main/default/testSuites/SampleSuite.testSuite',
      `<ApexTestSuite>
          <testClassName>TestClass1</testClassName>
          <testClassName>TestClass2</testClassName>
      </ApexTestSuite>`
    );

    // Add the test classes referenced in the suite
    await createTemporaryCommit(
      'chore: add TestClass1 and TestClass2',
      'force-app/main/default/classes/TestClass1.cls',
      'dummy content for TestClass1'
    );
    await createTemporaryCommit(
      'chore: add TestClass2',
      'force-app/main/default/classes/TestClass2.cls',
      'dummy content for TestClass2'
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

  it('confirm a test suite is parsed.', async () => {
    await ApexTestDelta.run(['--from', 'HEAD~3', '--to', 'HEAD']);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('TestClass1 TestClass2');
    const warnings = sfCommandStubs.warn
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(warnings).to.include('');
  });
});
