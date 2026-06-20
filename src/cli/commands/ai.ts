import { Command } from 'commander';
import * as readline from 'readline';
import { logger } from '../../utils/logger';
import { configExists, loadConfig } from '../../config/ConfigStore';
import { complete, listModels } from '../../ai/AIService';
import { DocumentRepository } from '../../markdown/DocumentRepository';

interface AiCompleteOptions {
  model?: string;
  section?: string;
  doc?: string;
  temperature?: string;
}

interface AiModelsOptions {}

interface AiConfigOptions {
  provider?: string;
  url?: string;
  model?: string;
}

export function registerAi(program: Command): void {
  const ai = program.command('ai').description('AI-assisted content generation using local LLMs (Ollama, LM Studio)');

  ai.command('complete <prompt>')
    .description('Generate content from a prompt')
    .option('--model <model>', 'Override the configured model')
    .option('--section <heading>', 'Target section heading (for context)')
    .option('--doc <id>', 'Document ID for additional context')
    .option('--temperature <temp>', 'Override temperature (0-1)')
    .action(async (prompt: string, options: AiCompleteOptions) => {
      await runAiComplete(prompt, options);
    });

  ai.command('interactive')
    .description('Start an interactive AI chat session')
    .option('--model <model>', 'Override the configured model')
    .action(async (options: { model?: string }) => {
      await runAiInteractive(options);
    });

  ai.command('models')
    .description('List available models from the configured provider')
    .action(async () => {
      await runAiModels();
    });

  ai.command('config')
    .description('Show or update AI configuration')
    .option('--provider <provider>', 'Set provider (ollama|lmstudio|openai-compatible)')
    .option('--url <url>', 'Set base URL')
    .option('--model <model>', 'Set model name')
    .action(async (options: AiConfigOptions) => {
      await runAiConfig(options);
    });
}

async function runAiComplete(prompt: string, options: AiCompleteOptions): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json).');
    logger.info('Run `mpos init` to create a new workspace.');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(root);

  if (!config.ai?.enabled) {
    logger.error('AI is not enabled.');
    logger.info('Enable it in .mpos/config.json:');
    logger.info('  "ai": { "enabled": true, "provider": "ollama", "model": "llama3.1" }');
    process.exitCode = 1;
    return;
  }

  if (options.model) config.ai.model = options.model;
  if (options.temperature) config.ai.temperature = parseFloat(options.temperature);

  let systemPrompt = '';

  if (options.doc) {
    const repository = new DocumentRepository(root);
    const doc = await repository.findById(options.doc);
    if (doc) {
      systemPrompt += `\nDocument: "${doc.frontmatter.title}" (${doc.frontmatter.type})\nStatus: ${doc.frontmatter.status}\n`;
    } else {
      logger.warn(`Document "${options.doc}" not found. Proceeding without document context.`);
    }
  }

  if (options.section) {
    systemPrompt += `\nTarget section: "${options.section}"\n`;
  }

  logger.info(`Generating with ${config.ai.provider}/${config.ai.model}...`);

  try {
    const result = await complete(config, {
      prompt,
      systemPrompt: systemPrompt || undefined,
      sectionHeading: options.section,
    });

    console.log('');
    console.log(result.text);
    console.log('');
    logger.info(`— ${result.provider}/${result.model}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`AI request failed: ${message}`);
    logger.info('Make sure your LLM server is running and accessible.');
    process.exitCode = 1;
  }
}

async function runAiInteractive(options: { model?: string }): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json).');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(root);

  if (!config.ai?.enabled) {
    logger.error('AI is not enabled.');
    logger.info('Enable it in .mpos/config.json.');
    process.exitCode = 1;
    return;
  }

  if (options.model) config.ai.model = options.model;

  logger.section(`Interactive AI — ${config.ai.provider}/${config.ai.model}`);
  console.log('Type your prompt and press Enter. Type "exit" or "quit" to stop.');
  console.log('');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (): void => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();
      if (!trimmed || trimmed === 'exit' || trimmed === 'quit') {
        rl.close();
        return;
      }

      try {
        const result = await complete(config, { prompt: trimmed });
        console.log('');
        console.log(`AI: ${result.text}`);
        console.log('');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error(`AI error: ${message}`);
      }

      ask();
    });
  };

  ask();
}

async function runAiModels(): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json).');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(root);

  if (!config.ai?.enabled) {
    logger.error('AI is not enabled.');
    process.exitCode = 1;
    return;
  }

  logger.info(`Fetching models from ${config.ai.provider}...`);

  try {
    const result = await listModels(config);

    if (result.models.length === 0) {
      logger.warn('No models found. Make sure your LLM server is running.');
      return;
    }

    logger.section(`Available models (${result.provider})`);
    for (const model of result.models) {
      const isCurrent = model === config.ai.model;
      console.log(`  ${isCurrent ? '→ ' : '  '}${model}${isCurrent ? ' (current)' : ''}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to list models: ${message}`);
    logger.info('Make sure your LLM server is running and accessible.');
    process.exitCode = 1;
  }
}

async function runAiConfig(options: AiConfigOptions): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json).');
    process.exitCode = 1;
    return;
  }

  const { loadConfig, saveConfig } = await import('../../config/ConfigStore');
  const config = await loadConfig(root);

  if (!options.provider && !options.url && !options.model) {
    logger.section('AI Configuration');
    logger.table([
      ['enabled', String(config.ai?.enabled ?? false)],
      ['provider', config.ai?.provider ?? 'ollama'],
      ['baseUrl', config.ai?.baseUrl ?? 'http://localhost:11434'],
      ['model', config.ai?.model ?? ''],
      ['temperature', String(config.ai?.temperature ?? 0.7)],
      ['maxTokens', String(config.ai?.maxTokens ?? 2048)],
    ]);
    console.log('');
    logger.info('Edit .mpos/config.json to change AI settings.');
    return;
  }

  if (!config.ai) {
    config.ai = {
      enabled: true,
      provider: 'ollama',
      baseUrl: 'http://localhost:11434',
      model: 'llama3.1',
      temperature: 0.7,
      maxTokens: 2048,
    };
  }

  config.ai.enabled = true;
  if (options.provider) config.ai.provider = options.provider as 'ollama' | 'lmstudio' | 'openai-compatible';
  if (options.url) config.ai.baseUrl = options.url;
  if (options.model) config.ai.model = options.model;

  await saveConfig(root, config);
  logger.success('AI configuration updated.');
  logger.table([
    ['provider', config.ai.provider],
    ['baseUrl', config.ai.baseUrl],
    ['model', config.ai.model],
  ]);
}
