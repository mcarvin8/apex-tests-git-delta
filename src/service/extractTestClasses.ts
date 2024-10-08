'use strict';

import { retrieveCommitMessages } from './retrieveCommitMessages.js';
import { validateClassPaths } from './validateClassPaths.js';

export async function extractTestClasses(
  fromRef: string,
  toRef: string
): Promise<{ validatedClasses: string; warnings: string[] }> {
  const testClasses: Set<string> = new Set();
  const { repoRoot, matchedMessages } = await retrieveCommitMessages(fromRef, toRef);

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
      ? await validateClassPaths(unvalidatedClasses, toRef, repoRoot)
      : { validatedClasses: new Set(), warnings: [] };
  let sortedClasses: string[] = [];
  if (result.validatedClasses.size > 0) {
    sortedClasses = Array.from(result.validatedClasses) as string[];
    sortedClasses = sortedClasses.sort((a, b) => a.localeCompare(b));
    validatedClasses = sortedClasses.join(' ');
  }

  return { validatedClasses, warnings: result.warnings };
}
