'use strict';

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
  };

  public async run(): Promise<TestDeltaResult> {
    const { flags } = await this.parse(ApexTestDelta);
    const toGitRef = flags['to'];
    const fromGitRef = flags['from'];

    const result = await extractTestClasses(fromGitRef, toGitRef);
    const tests = result.validatedClasses;
    const warnings = result.warnings;
    if (warnings.length > 0) {
      warnings.forEach((warning) => {
        this.warn(warning);
      });
    }
    this.log(tests);
    return { tests, warnings };
  }
}
