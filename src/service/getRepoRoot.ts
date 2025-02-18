'use strict';
import { SimpleGit } from 'simple-git';

export async function getRepoRoot(git: SimpleGit): Promise<string> {
  return (await git.revparse('--show-toplevel')).trim();
}
