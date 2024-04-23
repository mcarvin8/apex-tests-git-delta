'use strict';
/* eslint-disable no-await-in-loop */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

interface SfdxProject {
  packageDirectories: Array<{ path: string }>;
}

export async function getPackageDirectories(
  dxConfigFile: string
): Promise<{ repoRoot: string; packageDirectories: string[] }> {
  const dxConfigFilePath = resolve(dxConfigFile);
  if (!existsSync(dxConfigFilePath)) {
    throw Error(`Salesforce DX Config File does not exist in this path: ${dxConfigFile}`);
  }

  const sfdxProjectRaw: string = await readFile(dxConfigFilePath, 'utf-8');
  const sfdxProject: SfdxProject = JSON.parse(sfdxProjectRaw) as SfdxProject;
  const repoRoot = dirname(dxConfigFilePath);
  const packageDirectories = sfdxProject.packageDirectories.map((directory) => resolve(repoRoot, directory.path));
  return { repoRoot, packageDirectories };
}
