'use strict';

import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';

import { gitAdapter } from '../../../src/service/gitAdapter.js';
import { regExFile, regExFileContents, sfdxConfigFile, sfdxConfigJsonString } from './testConstants.js';

export async function setupTestRepo(): Promise<string> {
  const tempDir = mkdtempSync('../git-temp-');

  process.chdir(tempDir);
  const git = gitAdapter();

  await mkdir('force-app/main/default/classes', { recursive: true });
  await mkdir('packaged/classes', { recursive: true });
  await git.init();
  await writeFile(regExFile, regExFileContents);
  await writeFile(sfdxConfigFile, sfdxConfigJsonString);
  let userName;
  let userEmail;

  try {
    userName = await git.getConfig('user.name');
    userEmail = await git.getConfig('user.email');
  } catch (error) {
    // Ignore errors if the git config values are not set
  }

  if (!userName?.value && !userEmail?.value) {
    await git.addConfig('user.name', 'CI Bot', false, 'global');
    await git.addConfig('user.email', '90224411+mcarvin8@users.noreply.github.com', false, 'global');
  }
  return tempDir;
}
