'use strict';

import { readFileSync } from 'node:fs';
import { simpleGit, SimpleGit, SimpleGitOptions, DefaultLogFields, LogResult } from 'simple-git';

export async function retrieveCommitMessages(
  fromCommit: string,
  toCommit: string,
  regexFilePath: string
): Promise<string[]> {
  const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: false,
  };
  const git: SimpleGit = simpleGit(options);
  const result: LogResult<string | DefaultLogFields> = await git.log({ from: fromCommit, to: toCommit, format: '%s' });

  // Filter only entries that match the DefaultLogFields type
  const commitMessages: string[] = (result.all as DefaultLogFields[]).map((commit) => commit.message);

  let regex: RegExp;
  let regexPattern = '';
  try {
    regexPattern = readFileSync(regexFilePath, 'utf-8').trim();
    regex = new RegExp(regexPattern, 'g');
  } catch (err) {
    throw Error(`The regular expression in '${regexFilePath}' is invalid.`);
  }

  const matchedMessages: string[] = [];
  commitMessages.forEach((message) => {
    let match;
    while ((match = regex.exec(message)) !== null) {
      if (match[1]) {
        matchedMessages.push(match[1]);
      }
    }
  });

  return matchedMessages;
}
