'use strict';

import * as fs from 'node:fs';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { TO_DEFAULT_VALUE } from '../../constants/gitConstants.js';
import { extractTestClasses } from '../../service/extractTestClasses.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('apex-tests-git-delta', 'delta');

export type TestDeltaResult = {
  tests: string;
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
      default: TO_DEFAULT_VALUE,
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
    const deltaTests = result.validatedClasses;
    const warnings = result.warnings;
    this.log(deltaTests);
    fs.writeFileSync(output, deltaTests);
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }
    return { tests: deltaTests };
  }
}
