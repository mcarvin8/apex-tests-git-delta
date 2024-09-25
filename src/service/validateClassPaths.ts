'use strict';
/* eslint-disable no-await-in-loop */

import { promises as fsPromises, readFile, stat, readdir } from 'node:fs';
import { join } from 'node:path';
import git from 'isomorphic-git';
import { XMLParser } from 'fast-xml-parser';

import { getPackageDirectories } from './getPackageDirectories.js';
import { ApexTestSuite } from './types.js';

export async function validateClassPaths(
  unvalidatedClasses: string[],
  toCommitHash: string,
  repoRoot: string
): Promise<{ validatedClasses: Set<string>; warnings: string[] }> {
  const packageDirectories = await getPackageDirectories(repoRoot);
  const fs = { promises: fsPromises, readFile, stat, readdir };
  const repoFiles = await git.listFiles({ fs, dir: repoRoot, ref: toCommitHash });
  const warnings: string[] = [];

  const validatedClasses: Set<string> = new Set();
  for (const unvalidatedClass of unvalidatedClasses) {
    const validated = await validateClassOrSuite(
      unvalidatedClass,
      packageDirectories,
      repoFiles,
      repoRoot,
      toCommitHash,
      validatedClasses,
      warnings
    );
    if (!validated) {
      warnings.push(
        `The class ${unvalidatedClass} was not found in any package directory or test suite in commit ${toCommitHash} and will not be added to the delta test classes.`
      );
    }
  }
  return { validatedClasses, warnings };
}

async function validateClassOrSuite(
  unvalidatedClass: string,
  packageDirectories: string[],
  repoFiles: string[],
  repoRoot: string,
  toCommitHash: string,
  validatedClasses: Set<string>,
  warnings: string[]
): Promise<boolean> {
  for (const packageDirectory of packageDirectories) {
    if (fileExistsInCommit(`${unvalidatedClass}.cls`, repoFiles, packageDirectory)) {
      validatedClasses.add(unvalidatedClass);
      return true;
    }

    if (
      await validateTestSuite(
        unvalidatedClass,
        packageDirectory,
        repoFiles,
        repoRoot,
        toCommitHash,
        validatedClasses,
        warnings
      )
    ) {
      return true;
    }
  }
  return false;
}

async function validateTestSuite(
  unvalidatedClass: string,
  packageDirectory: string,
  repoFiles: string[],
  repoRoot: string,
  toCommitHash: string,
  validatedClasses: Set<string>,
  warnings: string[]
): Promise<boolean> {
  const testSuitePathInRepo = repoFiles.find(
    (file) => file.endsWith(`${unvalidatedClass}.testSuite`) && file.includes(packageDirectory)
  );

  if (!testSuitePathInRepo) {
    return false;
  }

  const testSuiteFilePath = join(repoRoot, testSuitePathInRepo);
  const extractedTestClasses = await extractTestClassesFromSuite(testSuiteFilePath);

  for (const testClass of extractedTestClasses) {
    if (repoFiles.some((file) => file.endsWith(`${testClass}.cls`))) {
      validatedClasses.add(testClass);
    } else {
      warnings.push(`Test class ${testClass} from suite ${unvalidatedClass} not found in commit ${toCommitHash}.`);
    }
  }

  return true;
}

function fileExistsInCommit(filePath: string, repoFiles: string[], packageDirectory: string): boolean {
  const filteredFiles = repoFiles.filter((file) => file.startsWith(packageDirectory));
  return filteredFiles.some((file) => file.endsWith(filePath));
}

async function extractTestClassesFromSuite(testSuitePath: string): Promise<string[]> {
  try {
    const fileContent = await fsPromises.readFile(testSuitePath, 'utf8');
    const parser = new XMLParser();

    const parsed: ApexTestSuite = parser.parse(fileContent) as ApexTestSuite;

    let testClassEntries: string[] = [];
    const testClassName = parsed?.ApexTestSuite?.testClassName;
    if (testClassName) {
      testClassEntries = Array.isArray(testClassName) ? testClassName : [testClassName];
    }

    const testClassNames: string[] = [];

    for (const entry of testClassEntries) {
      if (entry === '*') {
        const allClasses = await git.listFiles({ fs: { promises: fsPromises }, dir: testSuitePath, ref: 'HEAD' });
        allClasses
          .filter((file) => file.endsWith('.cls'))
          .forEach((clsFile) => testClassNames.push(clsFile.replace(/\.cls$/, '')));
      } else if (entry.endsWith('.*')) {
        const namespace = entry.replace(/\.\*$/, '');
        const namespaceClasses = await git.listFiles({ fs: { promises: fsPromises }, dir: testSuitePath, ref: 'HEAD' });
        namespaceClasses
          .filter((file) => file.startsWith(namespace) && file.endsWith('.cls'))
          .forEach((clsFile) => testClassNames.push(clsFile.replace(/\.cls$/, '')));
      } else {
        testClassNames.push(entry);
      }
    }

    return testClassNames;
  } catch (error) {
    throw Error(`Error reading or parsing test suite file: ${testSuitePath}`);
  }
}
