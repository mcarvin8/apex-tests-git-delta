'use strict';

import { mkdtempSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openRepository, type Repository } from '@scolladon/tsgit';

import { regExFile, regExFileContents, sfdxConfigFile, sfdxConfigJsonString } from './testConstants.js';

export async function setupTestRepo(): Promise<{ tempDir: string; repo: Repository }> {
  const tempDir = mkdtempSync(join(tmpdir(), 'git-temp-'));
  const repo = await openRepository({ cwd: tempDir });

  await mkdir(join(tempDir, 'force-app/main/default/classes'), { recursive: true });
  await mkdir(join(tempDir, 'packaged/classes'), { recursive: true });
  await repo.init();
  await writeFile(join(tempDir, regExFile), regExFileContents);
  await writeFile(join(tempDir, sfdxConfigFile), sfdxConfigJsonString);

  await repo.config.set({ key: 'user.name', value: 'CI Bot', scope: 'local' });
  await repo.config.set({ key: 'user.email', value: '90224411+mcarvin8@users.noreply.github.com', scope: 'local' });
  await repo.config.set({ key: 'commit.gpgsign', value: 'false', scope: 'local' });
  await repo.config.set({ key: 'tag.gpgsign', value: 'false', scope: 'local' });
  return { tempDir, repo };
}
