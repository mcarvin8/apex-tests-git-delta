'use strict';

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
    'to': Flags.string({
      char: 't',
      summary: messages.getMessage('flags.to.summary'),
      required: true,
      default: TO_DEFAULT_VALUE,
    }),
    'from': Flags.string({
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
  };

  public async run(): Promise<TestDeltaResult> {
    const { flags } = await this.parse(ApexTestDelta);
    const toGitRef = flags['to'];
    const fromGitRef = flags['from'];
    const regExFile = flags['regular-expression'];

    const deltaTests = extractTestClasses(fromGitRef, toGitRef, regExFile);
    this.log(deltaTests);

    return { tests: deltaTests };
  }
}
