'use strict';

import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

import { retrieveCommitMessages } from './retrieveCommitMessages.js';
import { validateClassPaths } from './validateClassPaths.js';

export async function extractTestClasses(
  fromRef: string,
  toRef: string,
  regex: string
): Promise<{ validatedClasses: string; warnings: string[] }> {
  const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: true,
  };
  const git: SimpleGit = simpleGit(options);

  const testClasses: Set<string> = new Set();
  const matchedMessages = await retrieveCommitMessages(fromRef, toRef, regex, git);

  matchedMessages.forEach((message: string) => {
    // Split the commit message by commas or spaces
    const classes = message.split(/,|\s/);

    classes.forEach((testClass: string) => {
      // Remove leading/trailing whitespaces and add non-empty strings to the set
      const trimmedClass = testClass.trim();
      if (trimmedClass !== '') {
        testClasses.add(trimmedClass);
      }
    });
  });

  const unvalidatedClasses: string[] = Array.from(testClasses);
  let validatedClasses: string = '';
  const result =
    unvalidatedClasses.length > 0
      ? await validateClassPaths(unvalidatedClasses, toRef, git)
      : { validatedClasses: new Set(), warnings: [] };
  let sortedClasses: string[] = [];
  if (result.validatedClasses.size > 0) {
    sortedClasses = Array.from(result.validatedClasses) as string[];
    sortedClasses = sortedClasses.sort((a, b) => a.localeCompare(b));
    validatedClasses = sortedClasses.join(' ');
  }

  return { validatedClasses, warnings: result.warnings };
}
