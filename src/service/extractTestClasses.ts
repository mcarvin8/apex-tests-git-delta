'use strict'
import { retrieveCommitMessages } from './retrieveCommitMessages.js';

export function extractTestClasses(fromRef: string, toRef: string, regex: string): string {
  const testClasses: Set<string> = new Set();
  const matchedMessages = retrieveCommitMessages(fromRef, toRef, regex);

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

  // Sort test classes alphabetically and then return a space-separated string
  const sortedClasses = Array.from(testClasses).sort((a, b) => a.localeCompare(b));
  return sortedClasses.join(' ');
}
