'use strict';
/* eslint-disable no-await-in-loop */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { SimpleGit } from 'simple-git';

interface SfdxProject {
  packageDirectories: Array<{ path: string }>;
}

export async function getPackageDirectories(
  git: SimpleGit
): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  const rootFolder = (await git.revparse('--show-toplevel')).trim();
  const dxConfigFilePath = resolve(rootFolder, 'sfdx-project.json');
  if (!existsSync(dxConfigFilePath)) {
    throw Error(`Cannot find sfdx-project.json in the root folder: ${rootFolder}`);
  }

  const sfdxProjectRaw: string = await readFile(dxConfigFilePath, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const repoRoot = dirname(dxConfigFilePath);
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => resolve(repoRoot, directory.path));
  return { repoRoot, packageDirectories };
}
