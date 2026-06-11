'use strict';

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Repository } from '@scolladon/tsgit';

export async function createTemporaryCommit(
  message: string,
  filePath: string,
  content: string,
  repo: Repository,
  baseDir: string,
): Promise<string> {
  await writeFile(join(baseDir, filePath), content);
  // Stage the file
  await repo.add([filePath]);

  // Commit with the provided message
  await repo.commit({ message });

  // Return the commit hash of the newly created commit
  const commitHash = String(await repo.revParse('HEAD'));

  return commitHash;
}
