import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import { logger } from '../../utils/logger';
import { fileExists, readFile, writeFile } from '../../utils/fileUtils';
import { resolveResourcePath } from '../../utils/paths';
import { todayString } from '../../utils/markdownUtils';
import { configExists, loadConfig, saveConfig } from '../../config/ConfigStore';
import { GitService } from '../../git/GitService';

interface InitOptions {
  name?: string;
  description?: string;
  gitInit?: boolean;
  dryRun?: boolean;
}

export function registerInit(program: Command): void {
  program
    .command('init')
    .description('Initialize an MPOS workspace in the current directory')
    .option('-n, --name <name>', 'Project name')
    .option('-d, --description <description>', 'Project description')
    .option('--git-init', 'Initialize a Git repository if one does not exist')
    .option('--dry-run', 'Preview what would be created without writing any files')
    .action(async (options: InitOptions) => {
      await runInit(options);
    });
}

const TEMPLATE_ROOT = resolveResourcePath('init-template');

async function runInit(options: InitOptions): Promise<void> {
  const projectRoot = process.cwd();
  const dryRun = options.dryRun ?? false;
  logger.setDryRun(dryRun);

  if (await configExists(projectRoot)) {
    logger.warn('MPOS is already initialized here (.mpos/config.json exists).');
    const { proceed } = await inquirer.prompt<{ proceed: boolean }>([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Continue anyway? Existing files will not be overwritten.',
        default: false,
      },
    ]);
    if (!proceed) {
      logger.info('Init cancelled.');
      return;
    }
  }

  let projectName = options.name;
  let projectDescription = options.description ?? '';
  if (!projectName) {
    const answers = await inquirer.prompt<{ name: string; description: string }>([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: path.basename(projectRoot),
        validate: (value: string) => value.trim().length > 0 || 'Name is required',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description (optional):',
      },
    ]);
    projectName = answers.name;
    projectDescription = answers.description;
  }

  logger.section(`Initializing MPOS — ${projectName}`);

  const vars = {
    project_name: projectName,
    description: projectDescription,
    date: todayString(),
  };

  const written: string[] = [];
  await copyTemplateTree(TEMPLATE_ROOT, projectRoot, vars, dryRun, written);

  if (dryRun) {
    logger.dryRun(`Would create ${written.length} file(s):`);
    for (const file of written) logger.dryRun(`  ${file}`);
  } else {
    const config = await loadConfig(projectRoot);
    config.project.name = projectName;
    config.project.description = projectDescription;
    config.project.created_at = vars.date;
    await saveConfig(projectRoot, config);
    logger.success(`Scaffolded ${written.length} file(s)`);
  }

  const git = new GitService(projectRoot);
  const isRepo = await git.isGitRepo();
  if (isRepo) {
    logger.success('Git repository detected');
  } else if (options.gitInit) {
    if (dryRun) {
      logger.dryRun('Would initialize a Git repository');
    } else {
      await git.init();
    }
  } else {
    logger.warn('No Git repository found. Re-run with --git-init to initialize one.');
  }

  logger.section('MPOS Initialized');
  console.log('');
  console.log('Next steps:');
  console.log('  1. mpos doctor                  — validate the workspace');
  console.log('  2. mpos doc create epic "..."   — create your first epic');
  console.log('  3. mpos status                  — check project status');
  console.log('');
}

/**
 * Recursively copy `resources/init-template/` into the workspace, rendering
 * `{{project_name}}`/`{{description}}`/`{{date}}` placeholders in Markdown files.
 * Files under `.mpos/templates/` are copied verbatim — their `{{...}}` placeholders
 * are rendered later, per-document, by `doc create`. Existing files are never
 * overwritten.
 */
async function copyTemplateTree(
  srcDir: string,
  destDir: string,
  vars: Record<string, string>,
  dryRun: boolean,
  written: string[]
): Promise<void> {
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyTemplateTree(srcPath, destPath, vars, dryRun, written);
      continue;
    }

    if (await fileExists(destPath)) continue;

    const relPath = path.relative(TEMPLATE_ROOT, srcPath).replace(/\\/g, '/');
    written.push(relPath);
    if (dryRun) continue;

    const isTemplateAsset = relPath.startsWith('.mpos/templates/');
    if (!isTemplateAsset && path.extname(entry.name) === '.md') {
      const content = await readFile(srcPath);
      await writeFile(destPath, renderInitTemplate(content, vars));
    } else {
      await fs.ensureDir(path.dirname(destPath));
      await fs.copy(srcPath, destPath);
    }
  }
}

function renderInitTemplate(content: string, vars: Record<string, string>): string {
  let out = content;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
  }
  return out;
}
