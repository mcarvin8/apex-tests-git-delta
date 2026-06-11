'use strict';

import type { Repository } from '@scolladon/tsgit';

export function getRepoRoot(repo: Repository): string {
  return repo.primitives.getRepoRoot();
}
