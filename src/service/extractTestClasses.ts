'use strict';

import { retrieveCommitMessages } from './retrieveCommitMessages.js';
import { validateClassPaths } from './validateClassPaths.js';
import { gitAdapter } from './gitAdapter.js';

export async function extractTestClasses(
  fromRef: string,
  toRef: string,
  skipValidate: boolean
): Promise<{ validatedClasses: string; warnings: string[] }> {
  const testClasses: Set<string> = new Set();
  const git = gitAdapter();
  const { repoRoot, matchedMessages } = await retrieveCommitMessages(fromRef, toRef, git);

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

  let sortedClasses: string[] = Array.from(testClasses).sort((a, b) => a.localeCompare(b));

  if (skipValidate) {
    return { validatedClasses: sortedClasses.join(' '), warnings: [] };
  }

  const result =
    sortedClasses.length > 0
      ? await validateClassPaths(sortedClasses, toRef, repoRoot, git)
      : { validatedClasses: new Set(), warnings: [] };

  let validatedClasses: string = '';
  if (result.validatedClasses.size > 0) {
    sortedClasses = Array.from(result.validatedClasses) as string[];
    sortedClasses = sortedClasses.sort((a, b) => a.localeCompare(b));
    validatedClasses = sortedClasses.join(' ');
  }

  return { validatedClasses, warnings: result.warnings };
}
