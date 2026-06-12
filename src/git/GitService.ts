import * as path from 'path';
import simpleGit, { SimpleGit, SimpleGitOptions } from 'simple-git';
import { logger } from '../utils/logger';

export interface GitStatus {
  isRepo: boolean;
  branch: string;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface CommitResult {
  hash: string;
  message: string;
  files: string[];
}

export class GitService {
  private git: SimpleGit;
  private initialized = false;

  constructor(private projectRoot: string) {
    this.git = simpleGit({
      baseDir: projectRoot,
      binary: 'git',
      maxConcurrentProcesses: 6,
    } as Partial<SimpleGitOptions>);
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }

  async init(): Promise<void> {
    await this.git.init();
    logger.success('Git repository initialized');
    this.initialized = true;
  }

  async getStatus(): Promise<GitStatus> {
    try {
      const status = await this.git.status();
      const branch = status.current ?? 'main';

      return {
        isRepo: true,
        branch,
        staged: status.staged,
        unstaged: [...status.modified, ...status.deleted],
        untracked: status.not_added,
        ahead: status.ahead,
        behind: status.behind,
      };
    } catch {
      return {
        isRepo: false,
        branch: '',
        staged: [],
        unstaged: [],
        untracked: [],
        ahead: 0,
        behind: 0,
      };
    }
  }

  async stageFiles(files: string[]): Promise<void> {
    if (files.length === 0) return;
    await this.git.add(files);
    logger.debug(`Staged ${files.length} file(s)`);
  }

  async stageAll(): Promise<void> {
    await this.git.add('-A');
    logger.debug('Staged all changes');
  }

  async commit(message: string, files?: string[]): Promise<CommitResult> {
    if (files && files.length > 0) {
      await this.stageFiles(files);
    }

    const result = await this.git.commit(message);
    const hash = result.commit;

    return {
      hash,
      message,
      files: files ?? [],
    };
  }

  async createTag(tagName: string, message?: string): Promise<void> {
    if (message) {
      await this.git.addAnnotatedTag(tagName, message);
    } else {
      await this.git.addTag(tagName);
    }
    logger.success(`Created Git tag: ${tagName}`);
  }

  async getDiff(files?: string[]): Promise<string> {
    try {
      if (files && files.length > 0) {
        return await this.git.diff(files);
      }
      return await this.git.diff();
    } catch {
      return '';
    }
  }

  async getStagedDiff(): Promise<string> {
    try {
      return await this.git.diff(['--staged']);
    } catch {
      return '';
    }
  }

  async getLog(maxCount = 10): Promise<{ hash: string; date: string; message: string; author: string }[]> {
    try {
      const log = await this.git.log({ maxCount });
      return log.all.map((entry) => ({
        hash: entry.hash.slice(0, 8),
        date: entry.date,
        message: entry.message,
        author: entry.author_name,
      }));
    } catch {
      return [];
    }
  }

  async getRecentChangedFiles(sinceDays = 7): Promise<string[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - sinceDays);
      // Get diff of files changed since the date vs. HEAD
      const sinceStr = since.toISOString().split('T')[0];
      const output = await this.git.raw(['log', `--since=${sinceStr}`, '--name-only', '--format=', '--diff-filter=ACMR']);
      const files = output
        .split('\n')
        .map((f) => f.trim())
        .filter((f) => f.length > 0 && !f.startsWith('commit'));
      return [...new Set(files)];
    } catch {
      return [];
    }
  }

  async createBranch(branchName: string, checkout = true): Promise<void> {
    await this.git.checkoutLocalBranch(branchName);
    logger.success(`Created and checked out branch: ${branchName}`);
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.branch();
      return branch.current;
    } catch {
      return 'main';
    }
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.getStatus();
    return (
      status.staged.length > 0 ||
      status.unstaged.length > 0 ||
      status.untracked.length > 0
    );
  }

  async autoCommit(
    changedFiles: string[],
    category: string,
    message?: string
  ): Promise<CommitResult | null> {
    const commitMessage = message ?? `docs(mpos): update ${category} [auto]`;
    try {
      if (changedFiles.length > 0) {
        await this.stageFiles(changedFiles.map((f) => path.join(this.projectRoot, f)));
      } else {
        await this.stageAll();
      }
      const hasStaged = (await this.git.diff(['--staged', '--name-only'])).trim().length > 0;
      if (!hasStaged) return null;

      return await this.commit(commitMessage);
    } catch (err) {
      logger.error('Auto-commit failed', err);
      return null;
    }
  }
}
