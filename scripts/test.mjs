import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
function tests(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? tests(`${path}/${e.name}`)
      : e.name.endsWith('.test.ts')
        ? [`${path}/${e.name}`]
        : [],
  );
}
process.chdir(fileURLToPath(new URL('..', import.meta.url)));
const files = ['packages/contracts/src', 'packages/budget-core/src', 'apps/backend/src'].flatMap(
  tests,
);
const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', '--test', '--test-concurrency=1', ...files],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      BUDGET_STORAGE: 'memory',
      BANK_DATA_FILE: '',
      DATABASE_URL: '',
      VERCEL: '',
    },
  },
);
process.exit(result.status ?? 1);
