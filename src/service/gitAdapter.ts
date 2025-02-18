import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

export function gitAdapter(): SimpleGit {
  const options: Partial<SimpleGitOptions> = {
    baseDir: process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: true,
  };
  return simpleGit(options);
}
