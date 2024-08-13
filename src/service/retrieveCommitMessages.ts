'use strict';

import { promises as fsPromises, readFile, stat, readdir } from 'node:fs';
import { resolve } from 'node:path';
import git from 'isomorphic-git';

import { getRepoRoot } from './getRepoRoot.js';

export async function retrieveCommitMessages(
  fromCommit: string,
  toCommit: string
): Promise<{ repoRoot: string; matchedMessages: string[] }> {
  const repoRoot = await getRepoRoot();
  process.chdir(repoRoot);
  const fs = { promises: fsPromises, readFile, stat, readdir };

  const resolvedToCommit = await resolveRef(toCommit, repoRoot);
  const resolvedFromCommit = await resolveRef(fromCommit, repoRoot);

  //  Retrieve the commit logs between the specified commits
  const commits = await git.log({
    fs,
    dir: repoRoot,
    ref: resolvedToCommit,
  });

  const commitMessages: string[] = [];
  let collectMessages = false;

  for (const commit of commits) {
    if (commit.oid === resolvedToCommit) {
      collectMessages = true;
    }

    if (collectMessages) {
      if (commit.oid === resolvedFromCommit) {
        break;
      }
      commitMessages.push(commit.commit.message);
    }
  }

  //  Read and compile the regex from the specified file
  let regex: RegExp;
  const regexFilePath = resolve(repoRoot, '.apextestsgitdeltarc');
  try {
    const regexPattern: string = (await fsPromises.readFile(regexFilePath, 'utf-8')).trim();
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

async function resolveRef(ref: string, repoRoot: string): Promise<string> {
  const fs = { promises: fsPromises, readFile, stat, readdir };
  const re = /^HEAD([~^])(\d+)$/;
  const match = re.exec(ref);
  if (match) {
    const count = parseInt(match[1], 10);
    const commits = await git.log({ fs, dir: repoRoot, depth: count + 1 });
    return commits.pop()?.oid ?? '';
  }

  return git.resolveRef({ fs, dir: repoRoot, ref });
}
