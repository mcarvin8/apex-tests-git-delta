'use strict';
/* eslint-disable no-await-in-loop */

import type { Repository } from '@scolladon/tsgit';

import { getPackageDirectories } from './getPackageDirectories.js';
import { listFilesAtCommit } from './gitAdapter.js';

export async function validateClassPaths(
  unvalidatedClasses: string[],
  toCommitHash: string,
  repoRoot: string,
  repo: Repository,
): Promise<{ validatedClasses: Set<string>; warnings: string[] }> {
  const packageDirectories = await getPackageDirectories(repoRoot);
  const warnings: string[] = [];

  const validatedClasses: Set<string> = new Set();
  for (const unvalidatedClass of unvalidatedClasses) {
    let validated: boolean = false;
    for (const packageDirectory of packageDirectories) {
      const fileExists = await fileExistsInCommit(`${unvalidatedClass}.cls`, toCommitHash, packageDirectory, repo);
      if (fileExists) {
        validatedClasses.add(unvalidatedClass);
        validated = true;
        break;
      }
    }
    if (!validated)
      warnings.push(
        `The class ${unvalidatedClass} was not found in any package directory found in commit ${toCommitHash} and will not be added to the delta test classes.`,
      );
  }
  return { validatedClasses, warnings };
}

async function fileExistsInCommit(
  filePath: string,
  commitHash: string,
  directory: string,
  repo: Repository,
): Promise<boolean> {
  const files = await listFilesAtCommit(repo, commitHash, directory);
  return files.some((file) => file.endsWith(filePath));
}
