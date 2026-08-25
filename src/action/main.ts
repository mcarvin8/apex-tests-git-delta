'use strict';

import * as core from '@actions/core';
import { extractTestClasses } from '../service/extractTestClasses.js';

const FORMATS = ['space', 'sf'] as const;
type Format = (typeof FORMATS)[number];

export async function run(): Promise<void> {
  try {
    const from = core.getInput('from', { required: true });
    const to = core.getInput('to') || 'HEAD';
    const skipTestValidation = core.getBooleanInput('skip-test-validation');
    const useMergeBase = core.getBooleanInput('merge-base');
    const format = core.getInput('format') || 'space';
    const workingDirectory = core.getInput('working-directory') || undefined;

    if (!isFormat(format)) {
      core.setFailed(`Invalid format "${format}". Expected "space" or "sf".`);
      return;
    }

    const result = await extractTestClasses(from, to, skipTestValidation, useMergeBase, workingDirectory);
    const testClasses = result.validatedClasses.split(' ').filter(Boolean);
    const tests =
      format === 'sf' ? testClasses.map((testClass) => `--tests ${testClass}`).join(' ') : result.validatedClasses;

    core.setOutput('tests', tests);
    core.setOutput('test-count', testClasses.length);
    core.setOutput('suites', result.suites.join('\n'));
    core.setOutput('suite-count', result.suites.length);
    core.setOutput('warnings', result.warnings.join('\n'));

    result.warnings.forEach((warning) => core.warning(warning));
    if (result.suites.length > 0) {
      core.info(`Resolved test suites: ${result.suites.join(' ')}`);
    }
    core.info(`Test classes: ${tests || '(none)'}`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

function isFormat(value: string): value is Format {
  return (FORMATS as readonly string[]).includes(value);
}
