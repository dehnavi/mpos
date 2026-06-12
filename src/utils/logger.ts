import chalk from 'chalk';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Success = 2,
  Warn = 3,
  Error = 4,
  Silent = 5,
}

let currentLevel: LogLevel = LogLevel.Info;
let dryRunMode = false;

export const logger = {
  setLevel(level: LogLevel): void {
    currentLevel = level;
  },

  setDryRun(enabled: boolean): void {
    dryRunMode = enabled;
  },

  debug(message: string): void {
    if (currentLevel <= LogLevel.Debug) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  },

  info(message: string): void {
    if (currentLevel <= LogLevel.Info) {
      console.log(chalk.blue('ℹ ') + message);
    }
  },

  success(message: string): void {
    if (currentLevel <= LogLevel.Success) {
      console.log(chalk.green('✓ ') + message);
    }
  },

  warn(message: string): void {
    if (currentLevel <= LogLevel.Warn) {
      console.log(chalk.yellow('⚠ ') + message);
    }
  },

  error(message: string, err?: unknown): void {
    if (currentLevel <= LogLevel.Error) {
      console.error(chalk.red('✗ ') + message);
      if (err instanceof Error && currentLevel <= LogLevel.Debug) {
        console.error(chalk.gray(err.stack ?? err.message));
      }
    }
  },

  section(title: string): void {
    if (currentLevel <= LogLevel.Info) {
      console.log('');
      console.log(chalk.bold.cyan(`── ${title} ──`));
    }
  },

  dryRun(message: string): void {
    if (currentLevel <= LogLevel.Info) {
      console.log(chalk.magenta('[DRY-RUN] ') + chalk.gray(message));
    }
  },

  conflict(message: string): void {
    if (currentLevel <= LogLevel.Warn) {
      console.log(chalk.red.bold('[CONFLICT] ') + chalk.red(message));
    }
  },

  change(file: string, changeType: string): void {
    if (currentLevel <= LogLevel.Info) {
      const icon =
        changeType === 'addition' ? chalk.green('+')
        : changeType === 'removal' ? chalk.red('-')
        : chalk.yellow('~');
      console.log(`  ${icon} ${chalk.dim(file)}`);
    }
  },

  table(rows: [string, string][]): void {
    if (currentLevel <= LogLevel.Info) {
      const maxKey = Math.max(...rows.map(([k]) => k.length));
      for (const [key, value] of rows) {
        console.log(`  ${chalk.bold(key.padEnd(maxKey))}  ${value}`);
      }
    }
  },

  isDryRun(): boolean {
    return dryRunMode;
  },
};
