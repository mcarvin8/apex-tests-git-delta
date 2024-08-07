'use strict';
/* eslint-disable no-await-in-loop */

import { promises as fsPromises, readFile, stat, readdir } from 'node:fs';
import git from 'isomorphic-git';

import { getPackageDirectories } from './getPackageDirectories.js';

export async function validateClassPaths(
  unvalidatedClasses: string[],
  toCommitHash: string,
  repoRoot: string
): Promise<{ validatedClasses: Set<string>; warnings: string[] }> {
  const packageDirectories = await getPackageDirectories(repoRoot);
  const fs = { promises: fsPromises, readFile, stat, readdir };
  const repoFiles = await git.listFiles({ fs, dir: repoRoot, ref: toCommitHash });
  const warnings: string[] = [];

  const validatedClasses: Set<string> = new Set();
  for (const unvalidatedClass of unvalidatedClasses) {
    let validated: boolean = false;
    for (const packageDirectory of packageDirectories) {
      const fileExists = fileExistsInCommit(`${unvalidatedClass}.cls`, repoFiles, packageDirectory);
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

function fileExistsInCommit(filePath: string, repoFiles: string[], packageDirectory: string): boolean {
  try {
    const filteredFiles = repoFiles.filter((file) => file.startsWith(packageDirectory));
    return filteredFiles.some((file) => file.endsWith(filePath));
  } catch (error) {
    return false;
  }
}
