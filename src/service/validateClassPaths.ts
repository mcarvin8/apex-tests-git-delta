'use strict';
/* eslint-disable no-await-in-loop */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { getPackageDirectories } from './getPackageDirectories.js';

export async function validateClassPaths(
  unvalidatedClasses: string[],
  dxConfigFile: string
): Promise<{ validatedClasses: Set<string>; warnings: string[] }> {
  const packageDirectories = await getPackageDirectories(dxConfigFile);
  const warnings: string[] = [];

  const validatedClasses: Set<string> = new Set();
  for (const unvalidatedClass of unvalidatedClasses) {
    let validated: boolean = false;
    for (const directory of packageDirectories) {
      const relativeFilePath = await searchRecursively(`${unvalidatedClass}.cls`, directory);
      if (relativeFilePath !== undefined) {
        validatedClasses.add(unvalidatedClass);
        validated = true;
        break;
      }
    }
    if (!validated)
      warnings.push(
        `The class ${unvalidatedClass} was not found in any package directory and will not be added to the delta test classes.`
      );
  }
  return { validatedClasses, warnings };
}

async function searchRecursively(fileName: string, dxDirectory: string): Promise<string | undefined> {
  const files = await fs.promises.readdir(dxDirectory);
  for (const file of files) {
    const filePath = path.join(dxDirectory, file);
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      const result = await searchRecursively(fileName, filePath);
      if (result) {
        return result;
      }
    } else if (file === fileName) {
      return filePath;
    }
  }
  return undefined;
}
