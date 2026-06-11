'use strict';
/* eslint-disable no-await-in-loop */

import { openRepository, type Repository } from '@scolladon/tsgit';

export async function openRepo(baseDir?: string): Promise<Repository> {
  return openRepository({ cwd: baseDir ?? process.cwd() });
}

export async function listFilesAtCommit(repo: Repository, commitHash: string, directory: string): Promise<string[]> {
  try {
    const commitOid = await repo.revParse(commitHash);
    const commitObj = await repo.primitives.readObject(commitOid);
    if (commitObj.type !== 'commit') return [];
    let treeOid = commitObj.data.tree;
    for (const part of directory.split('/').filter(Boolean)) {
      const tree = await repo.primitives.readTree(treeOid);
      const entry = tree.entries.find((e) => e.name === part);
      if (!entry) return [];
      treeOid = entry.id;
    }
    const files: string[] = [];
    for await (const entry of repo.primitives.walkTree(treeOid, { recursive: true })) {
      if (entry.mode !== '40000') {
        files.push(`${directory}/${entry.path}`);
      }
    }
    return files;
  } catch {
    return [];
  }
}

export async function readBlobAtCommitPath(
  repo: Repository,
  commitHash: string,
  filePath: string,
): Promise<Uint8Array | null> {
  try {
    const commitOid = await repo.revParse(commitHash);
    const commitObj = await repo.primitives.readObject(commitOid);
    if (commitObj.type !== 'commit') return null;
    let treeOid = commitObj.data.tree;
    const parts = filePath.split('/').filter(Boolean);
    for (let i = 0; i < parts.length - 1; i++) {
      const tree = await repo.primitives.readTree(treeOid);
      const entry = tree.entries.find((e) => e.name === parts[i]);
      if (!entry) return null;
      treeOid = entry.id;
    }
    const lastTree = await repo.primitives.readTree(treeOid);
    const fileEntry = lastTree.entries.find((e) => e.name === parts[parts.length - 1]);
    if (!fileEntry) return null;
    const blob = await repo.primitives.readBlob(fileEntry.id);
    return blob.content;
  } catch {
    return null;
  }
}

export type { Repository };
