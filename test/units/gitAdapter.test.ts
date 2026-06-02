'use strict';

import { describe, it, expect } from 'vitest';

import { gitAdapter } from '../../src/service/gitAdapter.js';

describe('gitAdapter', () => {
  it('defaults baseDir to process.cwd() when no argument provided', async () => {
    const git = gitAdapter();
    const root = await git.revparse('--show-toplevel');
    expect(root).toBeTruthy();
  });
});
