'use strict';

import { describe, it, expect } from 'vitest';

import { openRepo } from '../../src/service/gitAdapter.js';

describe('openRepo', () => {
  it('defaults baseDir to process.cwd() when no argument provided', async () => {
    const repo = await openRepo();
    const root = repo.primitives.getRepoRoot();
    expect(root).toBeTruthy();
    await repo.dispose();
  });
});
