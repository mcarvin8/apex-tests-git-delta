'use strict';

import { promises as fsPromises, readFile, stat, readdir, mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import git from 'isomorphic-git';

import { regExFile, regExFileContents, sfdxConfigFile, sfdxConfigJsonString } from './testConstants.js';

export async function setupTestRepo(): Promise<string> {
  const tempDir = mkdtempSync('../git-temp-');
  process.chdir(tempDir);
  const fs = { promises: fsPromises, readFile, stat, readdir };

  await mkdir('force-app/main/default/classes', { recursive: true });
  await mkdir('packaged/classes', { recursive: true });
  await git.init({ fs, dir: tempDir });
  await writeFile(regExFile, regExFileContents);
  await writeFile(sfdxConfigFile, sfdxConfigJsonString);
  return tempDir;
}
