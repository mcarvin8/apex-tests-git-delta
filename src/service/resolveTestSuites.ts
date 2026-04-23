'use strict';
/* eslint-disable no-await-in-loop */

import { basename } from 'node:path';
import { SimpleGit } from 'simple-git';
import { XMLParser } from 'fast-xml-parser';

import { getPackageDirectories } from './getPackageDirectories.js';

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
  git: SimpleGit,
): Promise<ResolvedTestSuites> {
  const localClasses: Set<string> = new Set();
  const namespacedClasses: Set<string> = new Set();
  const resolvedSuites: string[] = [];
  const warnings: string[] = [];

  if (suiteNames.length === 0) {
    return { localClasses, namespacedClasses, resolvedSuites, warnings };
  }

  const packageDirectories = await getPackageDirectories(repoRoot);
  const parser = new XMLParser({ isArray: (name) => name === 'testClassName' });
  const uniqueSuites = Array.from(new Set(suiteNames));
  const localClassInventory = await listLocalClasses(packageDirectories, toCommitHash, git);

  for (const suiteName of uniqueSuites) {
    const suiteFile = `${suiteName}.testSuite-meta.xml`;
    let matchedPath: string | undefined;
    for (const packageDirectory of packageDirectories) {
      const files = (await git.raw('ls-tree', '--name-only', '-r', toCommitHash, packageDirectory)).trim().split('\n');
      matchedPath = files.find((file) => file.endsWith(`/${suiteFile}`) || file === suiteFile);
      if (matchedPath) break;
    }

    if (!matchedPath) {
      warnings.push(
        `The test suite ${suiteName} was not found in any package directory at commit ${toCommitHash} and will not contribute test classes.`,
      );
      continue;
    }

    const xml = await git.show([`${toCommitHash}:${matchedPath}`]);
    const parsed = parser.parse(xml) as { ApexTestSuite?: { testClassName?: string[] } };
    const entries = parsed?.ApexTestSuite?.testClassName ?? [];
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

async function listLocalClasses(
  packageDirectories: string[],
  toCommitHash: string,
  git: SimpleGit,
): Promise<Set<string>> {
  const classes: Set<string> = new Set();
  for (const directory of packageDirectories) {
    const files = (await git.raw('ls-tree', '--name-only', '-r', toCommitHash, directory)).trim().split('\n');
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
