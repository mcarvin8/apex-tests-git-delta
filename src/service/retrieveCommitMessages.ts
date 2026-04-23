'use strict';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DefaultLogFields, LogResult, SimpleGit } from 'simple-git';

import { getRepoRoot } from './getRepoRoot.js';

export async function retrieveCommitMessages(
  fromCommit: string,
  toCommit: string,
  git: SimpleGit,
): Promise<{ repoRoot: string; matchedMessages: string[]; matchedSuites: string[] }> {
  const repoRoot = await getRepoRoot(git);
  process.chdir(repoRoot);
  const result: LogResult<string | DefaultLogFields> = await git.log({ from: fromCommit, to: toCommit, format: '%s' });

  // Filter only entries that match the DefaultLogFields type
  const commitMessages: string[] = (result.all as DefaultLogFields[]).map((commit) => commit.message);

  //  Read and compile the regex(es) from the specified file
  //  Line 1 = class regex (required), Line 2 = suite regex (optional)
  let classRegex: RegExp;
  let suiteRegex: RegExp | undefined;
  const regexFilePath = resolve(repoRoot, '.apextestsgitdeltarc');
  try {
    const lines = (await readFile(regexFilePath, 'utf-8'))
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    classRegex = new RegExp(lines[0], 'g');
    if (lines[1]) {
      suiteRegex = new RegExp(lines[1], 'g');
    }
  } catch (err) {
    throw Error(
      `The regular expression in '${regexFilePath}' is invalid or the file wasn't found in the repo root folder.`,
    );
  }

  //  Filter messages that match the regex(es)
  const matchedMessages: string[] = [];
  const matchedSuites: string[] = [];
  commitMessages.forEach((message) => {
    let classMatch;
    while ((classMatch = classRegex.exec(message)) !== null) {
      matchedMessages.push(classMatch[1]);
    }
    if (suiteRegex) {
      let suiteMatch;
      while ((suiteMatch = suiteRegex.exec(message)) !== null) {
        matchedSuites.push(suiteMatch[1]);
      }
    }
  });

  return { repoRoot, matchedMessages, matchedSuites };
}
