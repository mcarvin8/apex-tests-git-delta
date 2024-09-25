'use strict';

export type SfdxProject = {
  packageDirectories: Array<{ path: string }>;
};

export type ApexTestSuite = {
  ApexTestSuite?: {
    testClassName?: string | string[];
  };
};
