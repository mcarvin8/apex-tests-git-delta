'use strict';
/* eslint-disable no-await-in-loop */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { SfdxProject } from './types.js';
import { getRepoRoot } from './getRepoRoot.js';

export async function getPackageDirectories(): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  const repoRoot = await getRepoRoot();
  const dxConfigFilePath = resolve(repoRoot, 'sfdx-project.json');
  if (!existsSync(dxConfigFilePath)) {
    throw Error(`Cannot find sfdx-project.json in the root folder: ${repoRoot}`);
  }

  const sfdxProjectRaw: string = await readFile(dxConfigFilePath, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => directory.path);
  return { repoRoot, packageDirectories };
}
