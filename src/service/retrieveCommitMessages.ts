'use strict';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';

export function retrieveCommitMessages(fromCommit: string, toCommit: string, regexFilePath: string): string[] {
  const gitLogCommand = `git log --format=%s ${fromCommit}..${toCommit}`;
  let commitMessages: string;
  try {
    commitMessages = execSync(gitLogCommand, { encoding: 'utf-8' });
  } catch (err) {
    throw Error('The git diff failed to run due to the above error.');
  }

  let regex: RegExp;
  let regexPattern = '';
  try {
    regexPattern = fs.readFileSync(regexFilePath, 'utf-8').trim();
    regex = new RegExp(regexPattern, 'g');
  } catch (err) {
    throw Error(`The regular expression in '${regexFilePath}' is invalid.`);
  }

  const matchedMessages: string[] = [];
  let match;
  while ((match = regex.exec(commitMessages)) !== null) {
    if (match[1]) {
      matchedMessages.push(match[1]);
    }
  }

  return matchedMessages;
}
