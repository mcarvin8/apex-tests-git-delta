import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';

export function gitAdapter(baseDir?: string): SimpleGit {
  const options: Partial<SimpleGitOptions> = {
    baseDir: baseDir ?? process.cwd(),
    binary: 'git',
    maxConcurrentProcesses: 6,
    trimmed: true,
  };
  return simpleGit(options);
}
