'use strict';

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { extractTestClasses } from '../../../src/service/extractTestClasses.js';
import { gitAdapter } from '../../../src/service/gitAdapter.js';
import { createTemporaryCommit } from '../../utils/createTemporaryCommit.js';
import { setupTestRepo } from '../../utils/setupTestRepo.js';
import { regExFile } from '../../utils/testConstants.js';

const suiteXml = (classes: string[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<ApexTestSuite xmlns="http://soap.sforce.com/2006/04/metadata">',
    ...classes.map((c) => `    <testClassName>${c}</testClassName>`),
    '</ApexTestSuite>',
    '',
  ].join('\n');

describe('atgd test suite parsing', () => {
  let tempDir: string;
  const originalDir = process.cwd();

  beforeAll(async () => {
    tempDir = await setupTestRepo();
    const git = gitAdapter();

    // Overwrite the rc file with a two-line version that also recognizes Suite::<name>::Suite markers.
    await writeFile(
      regExFile,
      ['[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]', '[Ss][Uu][Ii][Tt][Ee]::(.*?)::[Ss][Uu][Ii][Tt][Ee]'].join('\n'),
    );
    await mkdir('force-app/main/default/testSuites', { recursive: true });

    // Seed the repo with test classes referenced directly and via the suite.
    await createTemporaryCommit(
      'chore: seed Apex::SeedTest::Apex',
      'force-app/main/default/classes/SeedTest.cls',
      'public with sharing class SeedTest {}',
      git,
    );
    await createTemporaryCommit(
      'chore: add suite members',
      'force-app/main/default/classes/AccountTest.cls',
      'public with sharing class AccountTest {}',
      git,
    );
    await createTemporaryCommit(
      'chore: add second suite member',
      'force-app/main/default/classes/ContactTest.cls',
      'public with sharing class ContactTest {}',
      git,
    );
    // Commit the test suite metadata file.
    await createTemporaryCommit(
      'chore: add MyRegressionSuite',
      'force-app/main/default/testSuites/MyRegressionSuite.testSuite-meta.xml',
      suiteXml(['AccountTest', 'ContactTest']),
      git,
    );
    // Commit referencing the suite in the message.
    await createTemporaryCommit(
      'chore: regression pass Suite::MyRegressionSuite::Suite',
      'force-app/main/default/classes/ContactTest.cls',
      'public with sharing class ContactTest { /* v2 */ }',
      git,
    );
    // Commit referencing a missing suite plus a direct class.
    await createTemporaryCommit(
      'chore: misc Suite::NonExistentSuite::Suite Apex::SeedTest::Apex',
      'force-app/main/default/classes/SeedTest.cls',
      'public with sharing class SeedTest { /* v2 */ }',
      git,
    );
    // Commit an empty suite and reference it.
    await createTemporaryCommit(
      'chore: add empty suite',
      'force-app/main/default/testSuites/EmptySuite.testSuite-meta.xml',
      suiteXml([]),
      git,
    );
    await createTemporaryCommit(
      'chore: run empty Suite::EmptySuite::Suite',
      'force-app/main/default/classes/SeedTest.cls',
      'public with sharing class SeedTest { /* v3 */ }',
      git,
    );
  });

  afterAll(async () => {
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('expands a referenced suite into its member classes', async () => {
    const result = await extractTestClasses('HEAD~4', 'HEAD~3', false);
    expect(result.validatedClasses).toEqual('AccountTest ContactTest');
    expect(result.suites).toEqual(['MyRegressionSuite']);
    expect(result.warnings).toEqual([]);
  });

  it('unions suite members with directly-referenced classes and warns on missing suites', async () => {
    const result = await extractTestClasses('HEAD~3', 'HEAD~2', false);
    expect(result.validatedClasses).toEqual('SeedTest');
    expect(result.suites).toEqual([]);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes('NonExistentSuite'))).toBe(true);
  });

  it('skips validation but still expands suite members', async () => {
    const result = await extractTestClasses('HEAD~4', 'HEAD~3', true);
    expect(result.validatedClasses).toEqual('AccountTest ContactTest');
    expect(result.suites).toEqual(['MyRegressionSuite']);
  });

  it('warns when a suite has no testClassName entries', async () => {
    const result = await extractTestClasses('HEAD~1', 'HEAD', false);
    expect(result.validatedClasses).toEqual('');
    expect(result.suites).toEqual([]);
    expect(result.warnings.some((w) => w.includes('EmptySuite') && w.includes('no testClassName entries'))).toBe(true);
  });
});

describe('atgd test suite wildcards and namespaces', () => {
  let tempDir: string;
  const originalDir = process.cwd();

  beforeAll(async () => {
    tempDir = await setupTestRepo();
    const git = gitAdapter();
    await writeFile(
      regExFile,
      ['[Aa][Pp][Ee][Xx]::(.*?)::[Aa][Pp][Ee][Xx]', '[Ss][Uu][Ii][Tt][Ee]::(.*?)::[Ss][Uu][Ii][Tt][Ee]'].join('\n'),
    );
    await mkdir('force-app/main/default/testSuites', { recursive: true });

    // Local Apex classes that wildcards should match against.
    await createTemporaryCommit(
      'chore: add AClass',
      'force-app/main/default/classes/AClass.cls',
      'public with sharing class AClass {}',
      git,
    );
    await createTemporaryCommit(
      'chore: add AnotherClass',
      'force-app/main/default/classes/AnotherClass.cls',
      'public with sharing class AnotherClass {}',
      git,
    );
    await createTemporaryCommit(
      'chore: add AwesomeClass',
      'force-app/main/default/classes/AwesomeClass.cls',
      'public with sharing class AwesomeClass {}',
      git,
    );
    await createTemporaryCommit(
      'chore: add LocalTestClass',
      'force-app/main/default/classes/LocalTestClass.cls',
      'public with sharing class LocalTestClass {}',
      git,
    );
    await createTemporaryCommit(
      'chore: add Unrelated',
      'force-app/main/default/classes/Unrelated.cls',
      'public with sharing class Unrelated {}',
      git,
    );
    // The wildcard suite mirrors the API doc example.
    await createTemporaryCommit(
      'chore: add WildcardSuite',
      'force-app/main/default/testSuites/WildcardSuite.testSuite-meta.xml',
      suiteXml(['LocalTestClass', 'A*Class', 'Namespace1.NamespacedTestClass', 'Namespace1.*']),
      git,
    );
    await createTemporaryCommit(
      'chore: run Suite::WildcardSuite::Suite',
      'force-app/main/default/classes/AClass.cls',
      'public with sharing class AClass { /* v2 */ }',
      git,
    );
    // A second suite using a pattern that doesn't match anything to exercise the no-match warning.
    await createTemporaryCommit(
      'chore: add NoMatchSuite',
      'force-app/main/default/testSuites/NoMatchSuite.testSuite-meta.xml',
      suiteXml(['Zzz*Nope']),
      git,
    );
    await createTemporaryCommit(
      'chore: run Suite::NoMatchSuite::Suite',
      'force-app/main/default/classes/AClass.cls',
      'public with sharing class AClass { /* v3 */ }',
      git,
    );
    // A suite using pure '*' to grab every local class.
    await createTemporaryCommit(
      'chore: add AllSuite',
      'force-app/main/default/testSuites/AllSuite.testSuite-meta.xml',
      suiteXml(['*']),
      git,
    );
    await createTemporaryCommit(
      'chore: run Suite::AllSuite::Suite',
      'force-app/main/default/classes/AClass.cls',
      'public with sharing class AClass { /* v4 */ }',
      git,
    );
  });

  afterAll(async () => {
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('expands local wildcards and passes namespaced entries through', async () => {
    // HEAD~5 -> HEAD~4 contains the WildcardSuite reference commit.
    const result = await extractTestClasses('HEAD~5', 'HEAD~4', false);
    // 'A*Class' matches AClass, AnotherClass, AwesomeClass.
    // 'LocalTestClass' is literal local. Namespaced entries pass through.
    expect(result.validatedClasses).toEqual(
      'AClass AnotherClass AwesomeClass LocalTestClass Namespace1.* Namespace1.NamespacedTestClass',
    );
    expect(result.suites).toEqual(['WildcardSuite']);
    expect(result.warnings).toEqual([]);
  });

  it('warns when a wildcard pattern matches no local classes', async () => {
    // HEAD~3 -> HEAD~2 is the NoMatchSuite reference commit.
    const result = await extractTestClasses('HEAD~3', 'HEAD~2', false);
    expect(result.validatedClasses).toEqual('');
    expect(result.suites).toEqual(['NoMatchSuite']);
    expect(result.warnings.some((w) => w.includes("'Zzz*Nope'") && w.includes('matched no local Apex classes'))).toBe(
      true,
    );
  });

  it("expands a pure '*' wildcard to every local class", async () => {
    const result = await extractTestClasses('HEAD~1', 'HEAD', false);
    // Includes every .cls committed prior to HEAD (sfdxConfig file isn't a .cls).
    const classes = result.validatedClasses.split(' ');
    expect(classes).toEqual(
      expect.arrayContaining(['AClass', 'AnotherClass', 'AwesomeClass', 'LocalTestClass', 'Unrelated']),
    );
    expect(result.suites).toEqual(['AllSuite']);
  });
});

describe('atgd backward-compatible single-line rc', () => {
  let tempDir: string;
  const originalDir = process.cwd();

  beforeAll(async () => {
    tempDir = await setupTestRepo();
    const git = gitAdapter();
    await createTemporaryCommit(
      'chore: initial',
      'force-app/main/default/classes/InitialTest.cls',
      'public with sharing class InitialTest {}',
      git,
    );
    await createTemporaryCommit(
      'chore: only classes Apex::LonelyTest::Apex',
      'force-app/main/default/classes/LonelyTest.cls',
      'public with sharing class LonelyTest {}',
      git,
    );
  });

  afterAll(async () => {
    process.chdir(originalDir);
    await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it('still works with a one-line rc file and leaves suites empty', async () => {
    const result = await extractTestClasses('HEAD~1', 'HEAD', false);
    expect(result.validatedClasses).toEqual('LonelyTest');
    expect(result.suites).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
