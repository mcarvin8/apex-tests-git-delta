'use strict';

import { writeFile } from 'node:fs/promises';
import { promises as fsPromises, readFile, stat, readdir } from 'node:fs';
import git from 'isomorphic-git';

import { getRepoRoot } from '../../../src/service/getRepoRoot.js';

export async function createTemporaryCommit(message: string, filePath: string, content: string): Promise<string> {
  const fs = { promises: fsPromises, readFile, stat, readdir };
  await writeFile(filePath, content);
  const repoRoot = await getRepoRoot();

  await git.add({ fs, dir: repoRoot, filepath: filePath });
  const commitHash = await git.commit({
    fs,
    dir: repoRoot,
    author: {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
    },
    message,
  });

  return commitHash;
}
