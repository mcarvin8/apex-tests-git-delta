'use strict';
/* eslint-disable no-await-in-loop */

import { basename } from 'node:path';
import type { Repository } from '@scolladon/tsgit';
import { parse as txmlParse, simplify } from 'txml';
import type { TNode } from 'txml';

import { getPackageDirectories } from './getPackageDirectories.js';
import { listFilesAtCommit, readBlobAtCommitPath } from './gitAdapter.js';

export type ResolvedTestSuites = {
  localClasses: Set<string>;
  namespacedClasses: Set<string>;
  resolvedSuites: string[];
  warnings: string[];
};

export async function resolveTestSuites(
  suiteNames: string[],
  toCommitHash: string,
  repoRoot: string,
  repo: Repository,
): Promise<ResolvedTestSuites> {
  const localClasses: Set<string> = new Set();
  const namespacedClasses: Set<string> = new Set();
  const resolvedSuites: string[] = [];
  const warnings: string[] = [];

  if (suiteNames.length === 0) {
    return { localClasses, namespacedClasses, resolvedSuites, warnings };
  }

  const packageDirectories = await getPackageDirectories(repoRoot);
  const uniqueSuites = Array.from(new Set(suiteNames));
  const localClassInventory = await listLocalClasses(packageDirectories, toCommitHash, repo);

  for (const suiteName of uniqueSuites) {
    const matchedPath = await findSuitePath(suiteName, packageDirectories, toCommitHash, repo);
    if (!matchedPath) {
      warnings.push(
        `The test suite ${suiteName} was not found in any package directory at commit ${toCommitHash} and will not contribute test classes.`,
      );
      continue;
    }

    const entries = await parseSuiteEntries(matchedPath, toCommitHash, repo);
    if (entries === null) {
      warnings.push(
        `The test suite ${suiteName} file could not be read at commit ${toCommitHash} and will not contribute test classes.`,
      );
      continue;
    }
    if (entries.length === 0) {
      warnings.push(`The test suite ${suiteName} at commit ${toCommitHash} has no testClassName entries.`);
      continue;
    }

    expandSuiteEntries(suiteName, entries, localClassInventory, localClasses, namespacedClasses, warnings);
    resolvedSuites.push(suiteName);
  }

  resolvedSuites.sort((a, b) => a.localeCompare(b));
  return { localClasses, namespacedClasses, resolvedSuites, warnings };
}

async function findSuitePath(
  suiteName: string,
  packageDirectories: string[],
  toCommitHash: string,
  repo: Repository,
): Promise<string | undefined> {
  const suiteFile = `${suiteName}.testSuite-meta.xml`;
  for (const packageDirectory of packageDirectories) {
    const files = await listFilesAtCommit(repo, toCommitHash, packageDirectory);
    const match = files.find((file) => file.endsWith(`/${suiteFile}`) || file === suiteFile);
    if (match) return match;
  }
  return undefined;
}

async function parseSuiteEntries(
  matchedPath: string,
  toCommitHash: string,
  repo: Repository,
): Promise<string[] | null> {
  const blobContent = await readBlobAtCommitPath(repo, toCommitHash, matchedPath);
  if (!blobContent) return null;

  const xml = new TextDecoder().decode(blobContent);
  const parsed = simplify(txmlParse(xml) as TNode[]) as {
    ApexTestSuite?: {
      testClassName?: string | string[];
    };
  };

  const entries = parsed?.ApexTestSuite?.testClassName;

  if (!entries) {
    return [];
  }

  return Array.isArray(entries) ? entries : [entries];
}

async function listLocalClasses(
  packageDirectories: string[],
  toCommitHash: string,
  repo: Repository,
): Promise<Set<string>> {
  const classes: Set<string> = new Set();
  for (const directory of packageDirectories) {
    const files = await listFilesAtCommit(repo, toCommitHash, directory);
    for (const file of files) {
      if (file.endsWith('.cls')) {
        classes.add(basename(file, '.cls'));
      }
    }
  }
  return classes;
}

function expandSuiteEntries(
  suiteName: string,
  entries: string[],
  localClassInventory: Set<string>,
  localClasses: Set<string>,
  namespacedClasses: Set<string>,
  warnings: string[],
): void {
  for (const raw of entries) {
    const entry = String(raw).trim();
    if (entry === '') continue;

    // Namespaced entries (Namespace.Class or Namespace.*) cannot be resolved from the local source tree.
    // They are passed through to the output so Salesforce can resolve the managed-package test class at runtime.
    if (entry.includes('.')) {
      namespacedClasses.add(entry);
      continue;
    }

    if (!entry.includes('*')) {
      localClasses.add(entry);
      continue;
    }

    const matches = matchWildcard(entry, localClassInventory);
    if (matches.length === 0) {
      warnings.push(
        `The test suite ${suiteName} pattern '${entry}' matched no local Apex classes and will not contribute tests.`,
      );
      continue;
    }
    matches.forEach((className) => localClasses.add(className));
  }
}

function matchWildcard(pattern: string, inventory: Set<string>): string[] {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return Array.from(inventory).filter((className) => regex.test(className));
}
