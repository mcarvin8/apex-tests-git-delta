'use strict';

export type SfdxProject = {
  packageDirectories: Array<{ path: string }>;
};

export type TestDeltaResult = {
  tests: string;
  warnings: string[];
};
