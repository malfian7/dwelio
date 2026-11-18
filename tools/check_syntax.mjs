// Syntax-check every script listed in index.html (no dependencies, Node 18+).
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map((m) => m[1]);
let bad = 0;
for (const f of files) {
  try { execFileSync(process.execPath, ['--check', join(root, f)], { stdio: 'pipe' }); console.log('ok  ', f); }
  catch (e) { bad++; console.error('FAIL', f, '\n' + e.stderr.toString()); }
}
process.exit(bad ? 1 : 0);
