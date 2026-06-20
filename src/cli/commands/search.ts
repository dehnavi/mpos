import { Command } from 'commander';
import { logger } from '../../utils/logger';
import { configExists } from '../../config/ConfigStore';
import { DocumentRepository } from '../../markdown/DocumentRepository';
import { searchDocuments } from '../../search/searchService';

interface SearchOptions {
  type?: string;
  marker?: string;
  json: boolean;
}

export function registerSearch(program: Command): void {
  program
    .command('search <query>')
    .description('Search documents by title, id, tags, content, or marker')
    .option('--type <type>', 'Filter by document type')
    .option('--marker <name>', 'Filter by marker (e.g. OPEN_QUESTION, RISK, BUSINESS_RULE)')
    .option('--json', 'Output results as JSON', false)
    .action(async (query: string, options: SearchOptions) => {
      await runSearch(query, options);
    });
}

async function runSearch(query: string, options: SearchOptions): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json).');
    logger.info('Run `mpos init` to create a new workspace, or navigate to an existing one.');
    process.exitCode = 1;
    return;
  }

  const repository = new DocumentRepository(root);
  const results = await searchDocuments(repository, query, { type: options.type, marker: options.marker });

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    logger.info(`No matches found for "${query}".`);
    if (options.type) {
      logger.info(`Tip: You filtered by type "${options.type}". Try removing the --type filter.`);
    }
    if (options.marker) {
      logger.info(`Tip: You filtered by marker "${options.marker}". Try removing the --marker filter.`);
    }
    return;
  }

  console.log('');
  console.log(`Found ${results.length} result(s) for "${query}":`);
  console.log('');

  for (const result of results) {
    const typeLabel = result.type ? ` [${result.type}]` : '';
    console.log(`  ${result.id}${typeLabel}  ${result.title}`);
    console.log(`    ${result.path}`);
    console.log(`    ${result.snippet}`);
    console.log('');
  }
}
