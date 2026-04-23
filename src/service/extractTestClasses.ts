'use strict';

import { retrieveCommitMessages } from './retrieveCommitMessages.js';
import { resolveTestSuites } from './resolveTestSuites.js';
import { validateClassPaths } from './validateClassPaths.js';
import { gitAdapter } from './gitAdapter.js';

export async function extractTestClasses(
  fromRef: string,
  toRef: string,
  skipValidate: boolean,
): Promise<{ validatedClasses: string; warnings: string[]; suites: string[] }> {
  const localTestClasses: Set<string> = new Set();
  const git = gitAdapter();
  const { repoRoot, matchedMessages, matchedSuites } = await retrieveCommitMessages(fromRef, toRef, git);

  matchedMessages.forEach((message: string) => {
    // Split the commit message by commas or spaces
    const classes = message.split(/,|\s/);

    classes.forEach((testClass: string) => {
      // Remove leading/trailing whitespaces and add non-empty strings to the set
      const trimmedClass = testClass.trim();
      if (trimmedClass !== '') {
        localTestClasses.add(trimmedClass);
      }
    });
  });

  const suiteResult = await resolveTestSuites(matchedSuites, toRef, repoRoot, git);
  suiteResult.localClasses.forEach((className) => localTestClasses.add(className));

  const sortedLocal = Array.from(localTestClasses).sort((a, b) => a.localeCompare(b));

  if (skipValidate) {
    const combined = mergeAndSort(sortedLocal, suiteResult.namespacedClasses);
    return {
      validatedClasses: combined,
      warnings: suiteResult.warnings,
      suites: suiteResult.resolvedSuites,
    };
  }

  const validation =
    sortedLocal.length > 0
      ? await validateClassPaths(sortedLocal, toRef, repoRoot, git)
      : { validatedClasses: new Set<string>(), warnings: [] as string[] };

  const combined = mergeAndSort(Array.from(validation.validatedClasses), suiteResult.namespacedClasses);
  return {
    validatedClasses: combined,
    warnings: [...suiteResult.warnings, ...validation.warnings],
    suites: suiteResult.resolvedSuites,
  };
}

function mergeAndSort(localClasses: string[], namespacedClasses: Set<string>): string {
  const merged = new Set<string>([...localClasses, ...namespacedClasses]);
  return Array.from(merged)
    .sort((a, b) => a.localeCompare(b))
    .join(' ');
}
