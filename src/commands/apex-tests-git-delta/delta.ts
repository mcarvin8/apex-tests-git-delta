'use strict';

import { writeFile } from 'node:fs/promises';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { extractTestClasses } from '../../service/extractTestClasses.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('apex-tests-git-delta', 'delta');

export type TestDeltaResult = {
  tests: string;
  warnings: string[];
};

export default class ApexTestDelta extends SfCommand<TestDeltaResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    to: Flags.string({
      char: 't',
      summary: messages.getMessage('flags.to.summary'),
      required: true,
      default: 'HEAD',
    }),
    from: Flags.string({
      char: 'f',
      summary: messages.getMessage('flags.from.summary'),
      required: true,
    }),
    'regular-expression': Flags.file({
      char: 'e',
      summary: messages.getMessage('flags.regular-expression.summary'),
      required: true,
      exists: true,
      default: 'regex.txt',
    }),
    output: Flags.file({
      summary: messages.getMessage('flags.output.summary'),
      required: true,
      exists: false,
      default: 'runTests.txt',
    }),
    'sfdx-configuration': Flags.file({
      summary: messages.getMessage('flags.sfdx-configuration.summary'),
      char: 'c',
      required: true,
      exists: true,
      default: 'sfdx-project.json',
    }),
  };

  public async run(): Promise<TestDeltaResult> {
    const { flags } = await this.parse(ApexTestDelta);
    const toGitRef = flags['to'];
    const fromGitRef = flags['from'];
    const regExFile = flags['regular-expression'];
    const output = flags['output'];
    const sfdxConfigFile = flags['sfdx-configuration'];

    const result = await extractTestClasses(fromGitRef, toGitRef, regExFile, sfdxConfigFile);
    const tests = result.validatedClasses;
    const warnings = result.warnings;
    await writeFile(output, tests);
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }
    this.log(tests);
    return { tests, warnings };
  }
}
