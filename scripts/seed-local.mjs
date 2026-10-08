import { execFileSync } from 'node:child_process';
if (process.argv.length > 2)
  throw new Error('This development-only seed accepts no arguments.');
execFileSync(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'd1',
    'execute',
    'DB',
    '--local',
    '--config',
    'wrangler.local.json',
    '--file',
    'scripts/seed-local.sql',
  ],
  { stdio: 'inherit' },
);
