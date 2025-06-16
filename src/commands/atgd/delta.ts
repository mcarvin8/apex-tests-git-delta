'use strict';

import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { extractTestClasses } from '../../service/extractTestClasses.js';
import { TestDeltaResult } from '../../service/types.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('apex-tests-git-delta', 'delta');

export default class ApexTestDelta extends SfCommand<TestDeltaResult> {
  public static override readonly summary = messages.getMessage('summary');
  public static override readonly description = messages.getMessage('description');
  public static override readonly examples = messages.getMessages('examples');

  public static override readonly flags = {
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
    'skip-test-validation': Flags.boolean({
      char: 'v',
      summary: messages.getMessage('flags.skip-test-validation.summary'),
      required: true,
      default: false,
    }),
  };

  public async run(): Promise<TestDeltaResult> {
    const { flags } = await this.parse(ApexTestDelta);

    const result = await extractTestClasses(flags['from'], flags['to'], flags['skip-test-validation']);
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
