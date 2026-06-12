import { Command } from 'commander';
import { Express } from 'express';
import * as http from 'http';
import { exec } from 'child_process';
import { logger } from '../../utils/logger';
import { configExists, loadConfig } from '../../config/ConfigStore';
import { createIdeApp } from '../../ide/server';

interface IdeOptions {
  port?: string;
  host?: string;
}

const MAX_PORT_ATTEMPTS = 20;

export function registerIde(program: Command): void {
  program
    .command('ide')
    .description('Start the local browser IDE')
    .option('--port <port>', 'Port to listen on (defaults to ide.default_port in .mpos/config.json)')
    .option('--host <host>', 'Host to bind to (defaults to ide.host in .mpos/config.json)')
    .action(async (options: IdeOptions) => {
      await runIde(options);
    });
}

async function runIde(options: IdeOptions): Promise<void> {
  const root = process.cwd();
  if (!(await configExists(root))) {
    logger.error('Not an MPOS workspace (missing .mpos/config.json). Run `mpos init`.');
    process.exitCode = 1;
    return;
  }

  const config = await loadConfig(root);
  const host = options.host ?? config.ide.host;
  const requestedPort = options.port ? parseInt(options.port, 10) : config.ide.default_port;

  const app = createIdeApp(root, config);
  const { port, server } = await listen(app, host, requestedPort);

  if (port !== requestedPort) {
    logger.info(`Port ${requestedPort} is in use. Using port ${port} instead.`);
  }

  const url = `http://${host}:${port}`;
  logger.success(`MPOS IDE running at ${url}`);
  console.log('Press Ctrl+C to stop.');

  if (config.ide.auto_open_browser) {
    openBrowser(url);
  }

  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => server.close(() => resolve()));
  });
}

/** Listens on `startPort`, retrying on the next port if it's already in use. */
function listen(app: Express, host: string, startPort: number): Promise<{ port: number; server: http.Server }> {
  return new Promise((resolve, reject) => {
    let port = startPort;
    let attempts = 0;

    const tryListen = (): void => {
      const server = app.listen(port, host);
      server.once('listening', () => resolve({ port, server }));
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && attempts < MAX_PORT_ATTEMPTS) {
          attempts++;
          port++;
          tryListen();
        } else {
          reject(err);
        }
      });
    };

    tryListen();
  });
}

function openBrowser(url: string): void {
  const cmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(cmd, () => {
    // Ignore errors — opening a browser is best-effort.
  });
}
