'use strict';

import { type ObjectId, openRepository, type Repository } from '@scolladon/tsgit';

export async function openRepo(baseDir?: string): Promise<Repository> {
  return openRepository({ cwd: baseDir ?? process.cwd() });
}

const MAX_TAG_PEEL_DEPTH = 5;

// revParse resolves an annotated tag ref to the tag object itself, not the commit it
// points at, and mergeBase only understands commits — so peel any tag chain by hand.
async function peelToCommit(repo: Repository, oid: ObjectId): Promise<ObjectId> {
  let current = oid;
  for (let i = 0; i < MAX_TAG_PEEL_DEPTH; i++) {
    const object = await repo.primitives.readObject(current);
    if (object.type !== 'tag') return current;
    current = object.data.object;
  }
  throw new Error(`Exceeded max tag peel depth (${MAX_TAG_PEEL_DEPTH}) resolving '${oid}'.`);
}

export async function resolveMergeBase(repo: Repository, fromRef: string, toRef: string): Promise<string> {
  const fromOid = await peelToCommit(repo, await repo.revParse(fromRef));
  const toOid = await peelToCommit(repo, await repo.revParse(toRef));
  const [base] = await repo.primitives.mergeBase([toOid, fromOid]);
  if (!base) {
    throw new Error(`No merge base found between '${fromRef}' and '${toRef}'.`);
  }
  return base;
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
