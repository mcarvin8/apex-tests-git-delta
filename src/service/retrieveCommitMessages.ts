'use strict';

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DefaultLogFields, LogResult, SimpleGit } from 'simple-git';

import { getRepoRoot } from './getRepoRoot.js';

export async function retrieveCommitMessages(
  fromCommit: string,
  toCommit: string,
  git: SimpleGit
): Promise<{ repoRoot: string; matchedMessages: string[] }> {
  const repoRoot = await getRepoRoot(git);
  process.chdir(repoRoot);
  const result: LogResult<string | DefaultLogFields> = await git.log({ from: fromCommit, to: toCommit, format: '%s' });

  // Filter only entries that match the DefaultLogFields type
  const commitMessages: string[] = (result.all as DefaultLogFields[]).map((commit) => commit.message);

  //  Read and compile the regex from the specified file
  let regex: RegExp;
  const regexFilePath = resolve(repoRoot, '.apextestsgitdeltarc');
  try {
    const regexPattern: string = (await readFile(regexFilePath, 'utf-8')).trim();
    regex = new RegExp(regexPattern, 'g');
  } catch (err) {
    throw Error(
      `The regular expression in '${regexFilePath}' is invalid or the file wasn't found in the repo root folder.`
    );
  }

  //  Filter messages that match the regex
  const matchedMessages: string[] = [];
  commitMessages.forEach((message) => {
    let match;
    while ((match = regex.exec(message)) !== null) {
      if (match[1]) {
        matchedMessages.push(match[1]);
      }
    }
  });

  return { repoRoot, matchedMessages };
}
