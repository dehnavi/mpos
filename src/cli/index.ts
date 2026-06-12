import { Command } from 'commander';
import { registerInit } from './commands/init';
import { registerDoctor } from './commands/doctor';
import { registerStatus } from './commands/status';
import { registerDoc } from './commands/doc';
import { registerSearch } from './commands/search';
import { registerIde } from './commands/ide';
import { logger, LogLevel } from '../utils/logger';

export function buildCLI(): Command {
  const program = new Command();

  program
    .name('mpos')
    .description('Markdown Project Operating System — local-first documentation and planning agent')
    .version('1.0.0', '-v, --version', 'Output the current version')
    .option('--debug', 'Enable debug logging', false)
    .option('--silent', 'Suppress all output except errors', false)
    .hook('preAction', (thisCommand) => {
      const opts = thisCommand.opts() as { debug?: boolean; silent?: boolean };
      if (opts.debug) logger.setLevel(LogLevel.Debug);
      if (opts.silent) logger.setLevel(LogLevel.Error);
    });

  // Register all commands
  registerInit(program);
  registerDoctor(program);
  registerStatus(program);
  registerDoc(program);
  registerSearch(program);
  registerIde(program);

  // Handle unknown commands
  program.on('command:*', (operands: string[]) => {
    logger.error(`Unknown command: ${operands[0]}`);
    logger.info('Run `mpos --help` to see available commands');
    process.exit(1);
  });

  return program;
}
