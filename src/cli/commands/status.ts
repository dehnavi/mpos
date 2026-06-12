import { Command } from 'commander';
import { logger } from '../../utils/logger';
import { configExists, loadConfig } from '../../config/ConfigStore';
import { DocumentRepository } from '../../markdown/DocumentRepository';
import { getStatusSummary, TRACKED_TYPES } from '../../status/statusService';
import { GitService } from '../../git/GitService';

export function registerStatus(program: Command): void {
  program
    .command('status')
    .description('Show project status: planning counts, active sprint, validation, and Git status')
    .action(async () => {
      await runStatus();
    });
}

async function runStatus(): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json). Run `mpos init`.');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(root);
  const repository = new DocumentRepository(root);
  const summary = await getStatusSummary(root, config, repository);

  logger.section(`Project: ${summary.project.name}`);

  logger.section('Planning');
  for (const type of TRACKED_TYPES) {
    const byStatus = summary.byType[type];
    if (!byStatus) {
      logger.table([[type, '0']]);
      continue;
    }
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(byStatus).map(([s, c]) => `${s}: ${c}`).join(', ');
    logger.table([[type, `${total} (${breakdown})`]]);
  }

  logger.section('Active Sprint');
  console.log(summary.activeSprint ? `${summary.activeSprint.id} — ${summary.activeSprint.title}` : '(none)');

  logger.section('Validation');
  logger.table([
    ['critical', String(summary.validation.critical)],
    ['warning', String(summary.validation.warning)],
    ['info', String(summary.validation.info)],
  ]);

  logger.section('Git');
  const git = new GitService(root);
  const gitStatus = await git.getStatus();
  if (gitStatus.isRepo) {
    logger.table([
      ['branch', gitStatus.branch],
      ['staged', String(gitStatus.staged.length)],
      ['unstaged', String(gitStatus.unstaged.length)],
      ['untracked', String(gitStatus.untracked.length)],
    ]);
  } else {
    console.log('(not a Git repository)');
  }
}
