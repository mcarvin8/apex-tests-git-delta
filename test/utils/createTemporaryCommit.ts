'use strict';

import { writeFile } from 'node:fs/promises';
import { SimpleGit } from 'simple-git';

export async function createTemporaryCommit(
  message: string,
  filePath: string,
  content: string,
  git: SimpleGit
): Promise<string> {
  await writeFile(filePath, content);
  // Stage the file
  await git.add(filePath);

  // Commit with the provided message
  await git.commit(message);

  // Return the commit hash of the newly created commit
  const commitHash = (await git.revparse('HEAD')).trim();

  return commitHash;
}
