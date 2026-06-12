#!/usr/bin/env node

import { buildCLI } from './cli';

async function main(): Promise<void> {
  const program = buildCLI();
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error('Fatal error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
