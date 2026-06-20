import { Command } from 'commander';
import * as path from 'path';
import { fileExists } from '../../utils/fileUtils';
import { logger } from '../../utils/logger';
import { configExists, loadConfig } from '../../config/ConfigStore';
import { DocumentRepository } from '../../markdown/DocumentRepository';
import { validateDocument, findDuplicateIds } from '../../validation/ValidationEngine';
import { Severity } from '../../domain/types';

const REQUIRED_DIRS = [
  'docs',
  'planning',
  'tasks',
  'decisions',
  'changes',
  'tutorials',
  '.mpos/rules',
  '.mpos/templates',
  '.mpos/examples',
];

const REQUIRED_DOCS = [
  'docs/prd.md',
  'docs/business-rules.md',
  'docs/glossary.md',
  'docs/architecture.md',
];

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Check workspace health: structure, config, and document validity')
    .action(async () => {
      await runDoctor();
    });
}

async function runDoctor(): Promise<void> {
  const root = process.cwd();
  logger.section('MPOS Doctor');

  if (!(await configExists(root))) {
    logger.error('.mpos/config.json not found.');
    logger.info('Run `mpos init` to create a new workspace, or navigate to an existing one.');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(root);

  let critical = 0;
  let warning = 0;
  let info = 0;
  const report = (severity: Severity, message: string): void => {
    if (severity === Severity.Critical) {
      critical++;
      logger.error(message);
    } else if (severity === Severity.Warning) {
      warning++;
      logger.warn(message);
    } else {
      info++;
      logger.info(message);
    }
  };

  logger.info('Checking workspace structure...');
  for (const dir of REQUIRED_DIRS) {
    if (!(await fileExists(path.join(root, dir)))) {
      report(Severity.Critical, `Missing directory: ${dir}/`);
    }
  }
  for (const doc of REQUIRED_DOCS) {
    if (!(await fileExists(path.join(root, doc)))) {
      report(Severity.Critical, `Missing required document: ${doc}`);
    }
  }

  logger.info('Validating documents...');
  const repository = new DocumentRepository(root);
  const docs = await repository.listAll();
  for (const doc of docs) {
    const result = await validateDocument(root, doc, config);
    for (const finding of result.findings) {
      report(finding.severity, `${result.path}: ${finding.message}`);
    }
  }
  for (const finding of await findDuplicateIds(repository, config)) {
    report(finding.severity, finding.message);
  }

  logger.section('Summary');
  if (critical === 0 && warning === 0 && info === 0) {
    console.log('  ✓ All checks passing');
  } else {
    logger.table([
      ['critical', String(critical)],
      ['warning', String(warning)],
      ['info', String(info)],
    ]);
  }

  if (critical > 0) {
    console.log('');
    logger.info('Fix critical issues before proceeding. These may prevent MPOS from working correctly.');
    process.exitCode = 1;
  } else if (warning > 0) {
    console.log('');
    logger.info('Warnings are non-blocking but should be addressed for best results.');
  }
}
