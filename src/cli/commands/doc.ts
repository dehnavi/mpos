import { Command } from 'commander';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { configExists, loadConfig, nextId } from '../../config/ConfigStore';
import { DocumentRepository, MarkdownDocument } from '../../markdown/DocumentRepository';
import { SectionEditError } from '../../markdown/SectionEditor';
import { applyDocUpdate } from '../../markdown/applyDocUpdate';
import { loadTemplate, renderTemplate, stripLeadingComments, TemplateName } from '../../templates/TemplateRegistry';
import { parseMarkdown, stringifyMarkdown, todayString } from '../../utils/markdownUtils';
import { readFile } from '../../utils/fileUtils';
import { slugify } from '../../utils/slugify';
import { GitService } from '../../git/GitService';
import { findDuplicateIds, validateDocument } from '../../validation/ValidationEngine';
import { DocumentType, ID_PREFIXES, Severity } from '../../domain/types';

interface CreateTypeSpec {
  type: DocumentType;
  template: TemplateName;
}

const CREATE_TYPES: Record<string, CreateTypeSpec> = {
  epic: { type: DocumentType.Epic, template: 'epic' },
  story: { type: DocumentType.Story, template: 'story' },
  task: { type: DocumentType.Task, template: 'task' },
  sprint: { type: DocumentType.Sprint, template: 'sprint' },
  decision: { type: DocumentType.Decision, template: 'decision' },
  'change-request': { type: DocumentType.ChangeRequest, template: 'change-request' },
  'change-report': { type: DocumentType.ChangeReport, template: 'change-report' },
};

interface CreateOptions {
  epic?: string;
  story?: string;
  owner: string;
  priority: string;
  dryRun: boolean;
}

interface UpdateOptions {
  id: string;
  section?: string;
  text?: string;
  file?: string;
  append: boolean;
  status?: string;
  force: boolean;
}

interface DiffOptions {
  id: string;
  staged: boolean;
}

export function registerDoc(program: Command): void {
  const doc = program.command('doc').description('Create, update, validate, and diff managed documents');

  doc
    .command('create <type> <title>')
    .description(`Create a new document (${Object.keys(CREATE_TYPES).join(', ')})`)
    .option('--epic <id>', 'Parent epic ID (required for story)')
    .option('--story <id>', 'Parent story ID (required for task)')
    .option('--owner <owner>', 'Document owner', '')
    .option('--priority <priority>', 'Priority (critical|high|medium|low)', 'medium')
    .option('--dry-run', 'Preview without writing', false)
    .action(async (type: string, title: string, options: CreateOptions) => {
      await runDocCreate(type, title, options);
    });

  doc
    .command('update')
    .description('Update a single section or frontmatter field of a document')
    .requiredOption('--id <id>', 'Document ID')
    .option('--section <heading>', 'Top-level (##) heading to update')
    .option('--text <text>', 'New content for the section')
    .option('--file <path>', 'Read new section content from a file')
    .option('--append', 'Append to the section instead of replacing it', false)
    .option('--status <status>', 'Update the status field')
    .option('--force', 'Allow heading-set or id/type changes (use with care)', false)
    .action(async (options: UpdateOptions) => {
      await runDocUpdate(options);
    });

  doc
    .command('validate [id]')
    .description('Validate one or all documents against schema, headings, links, and IDs')
    .action(async (id?: string) => {
      await runDocValidate(id);
    });

  doc
    .command('diff')
    .description("Show a document's working-tree (or staged) Git diff")
    .requiredOption('--id <id>', 'Document ID')
    .option('--staged', 'Show the staged diff instead of the working-tree diff', false)
    .action(async (options: DiffOptions) => {
      await runDocDiff(options);
    });
}

async function runDocCreate(typeArg: string, title: string, options: CreateOptions): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json).');
    logger.info('Run `mpos init` to create a new workspace, or navigate to an existing one.');
    process.exitCode = 1;
    return;
  }

  const spec = CREATE_TYPES[typeArg];
  if (!spec) {
    logger.error(`Unknown type "${typeArg}".`);
    logger.info(`Available types: ${Object.keys(CREATE_TYPES).join(', ')}`);
    logger.info('Example: mpos doc create epic "My New Epic"');
    process.exitCode = 1;
    return;
  }

  const repository = new DocumentRepository(root);
  const vars: Record<string, string> = {
    title,
    date: todayString(),
    owner: options.owner ?? '',
  };

  if (spec.type === DocumentType.Story) {
    if (!options.epic) {
      logger.error('Story requires a parent epic.');
      logger.info('Usage: mpos doc create story "Title" --epic EPIC-001');
      logger.info('Use `mpos doc create epic "..."` to create an epic first.');
      process.exitCode = 1;
      return;
    }
    const epicDoc = await repository.findById(options.epic);
    if (!epicDoc) {
      logger.error(`Epic "${options.epic}" not found.`);
      logger.info('Use `mpos search <query>` to find existing epics.');
      process.exitCode = 1;
      return;
    }
    vars.epic_id = options.epic;
    vars.epic_slug = slugify(String(epicDoc.frontmatter.title));
  }

  if (spec.type === DocumentType.Task) {
    if (!options.story) {
      logger.error('Task requires a parent story.');
      logger.info('Usage: mpos doc create task "Title" --story STORY-001');
      logger.info('Use `mpos doc create story "..." --epic EPIC-001` to create a story first.');
      process.exitCode = 1;
      return;
    }
    const storyDoc = await repository.findById(options.story);
    if (!storyDoc) {
      logger.error(`Story "${options.story}" not found.`);
      logger.info('Use `mpos search <query>` to find existing stories.');
      process.exitCode = 1;
      return;
    }
    vars.story_id = options.story;
    vars.story_slug = slugify(String(storyDoc.frontmatter.title));
    vars.epic_id = options.epic ?? String(storyDoc.frontmatter.epic ?? '');
  }

  const id = options.dryRun ? `${ID_PREFIXES[spec.type]!.prefix}-XXX` : await nextId(root, spec.type);
  vars.id = id;

  const template = await loadTemplate(root, spec.template);
  let rendered = renderTemplate(stripLeadingComments(template), vars);

  if (options.priority) {
    const { frontmatter, content } = parseMarkdown(rendered);
    frontmatter.priority = options.priority;
    rendered = stringifyMarkdown(frontmatter, content);
  }

  const destPath = repository.resolveNewPath(spec.type, id, title);
  if (options.dryRun) {
    logger.dryRun(`Would create ${path.relative(root, destPath)} (id ${id})`);
    return;
  }

  await repository.writeRaw(destPath, rendered);
  logger.success(`Created ${path.relative(root, destPath)} (${id})`);
  logger.info(`Tip: Use \`mpos doc update --id ${id} --status active\` to change the status.`);
}

async function runDocUpdate(options: UpdateOptions): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json). Run `mpos init`.');
    process.exitCode = 1;
    return;
  }

  const repository = new DocumentRepository(root);
  const doc = await repository.findById(options.id);
  if (!doc) {
    logger.error(`Document "${options.id}" not found.`);
    process.exitCode = 1;
    return;
  }

  if (!options.section && !options.status) {
    logger.warn('Nothing to update — pass --section (with --text/--file) and/or --status.');
    return;
  }

  let text: string | undefined;
  if (options.section) {
    if (options.file) {
      text = await readFile(path.resolve(options.file));
    } else if (options.text !== undefined) {
      text = options.text;
    } else {
      logger.error('--section requires --text or --file');
      process.exitCode = 1;
      return;
    }
  }

  let raw: string;
  try {
    raw = applyDocUpdate(doc, {
      section: options.section,
      text,
      append: options.append,
      status: options.status,
      force: options.force,
    });
  } catch (err) {
    if (err instanceof SectionEditError) {
      logger.error(err.message);
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  await repository.writeRaw(doc.absPath, raw);
  logger.success(`Updated ${doc.relPath}`);
}

async function runDocValidate(id?: string): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json). Run `mpos init`.');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(root);
  const repository = new DocumentRepository(root);

  let docs: MarkdownDocument[];
  if (id) {
    const doc = await repository.findById(id);
    if (!doc) {
      logger.error(`Document "${id}" not found.`);
      process.exitCode = 1;
      return;
    }
    docs = [doc];
  } else {
    docs = await repository.listAll();
  }

  let critical = 0;
  let warning = 0;
  let info = 0;

  for (const doc of docs) {
    const result = await validateDocument(root, doc, config);
    for (const finding of result.findings) {
      if (finding.severity === Severity.Critical) {
        critical++;
        logger.error(`${result.path}: ${finding.message}`);
      } else if (finding.severity === Severity.Warning) {
        warning++;
        logger.warn(`${result.path}: ${finding.message}`);
      } else {
        info++;
        logger.info(`${result.path}: ${finding.message}`);
      }
    }
  }

  if (!id) {
    for (const finding of await findDuplicateIds(repository, config)) {
      if (finding.severity === Severity.Critical) {
        critical++;
        logger.error(finding.message);
      } else {
        warning++;
        logger.warn(finding.message);
      }
    }
  }

  if (critical === 0 && warning === 0 && info === 0) {
    logger.success('No issues found.');
  } else {
    logger.table([
      ['critical', String(critical)],
      ['warning', String(warning)],
      ['info', String(info)],
    ]);
  }

  if (critical > 0) {
    process.exitCode = 1;
  }
}

async function runDocDiff(options: DiffOptions): Promise<void> {
  const root = process.cwd();
  const repository = new DocumentRepository(root);
  const doc = await repository.findById(options.id);
  if (!doc) {
    logger.error(`Document "${options.id}" not found.`);
    process.exitCode = 1;
    return;
  }

  const git = new GitService(root);
  const diffText = options.staged ? await git.getStagedDiff() : await git.getDiff([doc.absPath]);

  if (!diffText.trim()) {
    logger.info('No changes.');
    return;
  }

  console.log(diffText);
}
