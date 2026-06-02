'use strict';

import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { SimpleGit } from 'simple-git';

import { gitAdapter } from '../../src/service/gitAdapter.js';
import { regExFile, regExFileContents, sfdxConfigFile, sfdxConfigJsonString } from './testConstants.js';

export async function setupTestRepo(): Promise<{ tempDir: string; git: SimpleGit }> {
  const tempDir = mkdtempSync(resolve('..', 'git-temp-'));
  const git = gitAdapter(tempDir);

  await mkdir(join(tempDir, 'force-app/main/default/classes'), { recursive: true });
  await mkdir(join(tempDir, 'packaged/classes'), { recursive: true });
  await git.init();
  await writeFile(join(tempDir, regExFile), regExFileContents);
  await writeFile(join(tempDir, sfdxConfigFile), sfdxConfigJsonString);

  await git.addConfig('user.name', 'CI Bot', false, 'local');
  await git.addConfig('user.email', '90224411+mcarvin8@users.noreply.github.com', false, 'local');
  await git.addConfig('commit.gpgsign', 'false', false, 'local');
  await git.addConfig('tag.gpgsign', 'false', false, 'local');
  return { tempDir, git };
}
