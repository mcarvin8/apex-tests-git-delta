'use strict';
/* eslint-disable no-await-in-loop */

import { SimpleGit } from 'simple-git';

import { getPackageDirectories } from './getPackageDirectories.js';

export async function validateClassPaths(
  unvalidatedClasses: string[],
  toCommitHash: string,
  git: SimpleGit
): Promise<{ validatedClasses: Set<string>; warnings: string[] }> {
  const { repoRoot, packageDirectories } = await getPackageDirectories(git);
  await git.cwd(repoRoot);
  const warnings: string[] = [];

  const validatedClasses: Set<string> = new Set();
  for (const unvalidatedClass of unvalidatedClasses) {
    let validated: boolean = false;
    for (const directory of packageDirectories) {
      const fileExists = await fileExistsInCommit(`${unvalidatedClass}.cls`, toCommitHash, directory, git);
      if (fileExists) {
        validatedClasses.add(unvalidatedClass);
        validated = true;
        break;
      }
    }
    if (!validated)
      warnings.push(
        `The class ${unvalidatedClass} was not found in any package directory found in commit ${toCommitHash} and will not be added to the delta test classes.`
      );
  }
  return { validatedClasses, warnings };
}

async function fileExistsInCommit(
  filePath: string,
  commitHash: string,
  directory: string,
  git: SimpleGit
): Promise<boolean> {
  try {
    const files = (await git.raw('ls-tree', '--name-only', '-r', commitHash, directory)).trim().split('\n');
    return files.some((file) => file.endsWith(filePath));
  } catch (error) {
    return false;
  }
}
