'use strict';
import { readFileSync } from 'node:fs';
import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

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
  const commitMessages = await git.raw('log', '--format=%s', `${fromCommit}..${toCommit}`);

  let regex: RegExp;
  let regexPattern = '';
  try {
    regexPattern = readFileSync(regexFilePath, 'utf-8').trim();
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
