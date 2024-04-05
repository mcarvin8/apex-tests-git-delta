'use strict';

import * as fs from 'node:fs';
import { execSync } from 'node:child_process';

export async function createTemporaryCommit(message: string, filePath: string, content: string): Promise<string> {
  await fs.promises.writeFile(filePath, content);

  // Stage the file
  execSync(`git add "${filePath}"`);

  // Commit with the provided message
  execSync(`git commit -m "${message}"`);

  // Return the commit hash of the newly created commit
  const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();

  return commitHash;
}
