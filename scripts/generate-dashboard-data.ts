import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const outDir = resolve('public');           // Pages の静的出力先に合わせる。docs/ を使うなら 'docs'
mkdirSync(outDir, { recursive: true });

const data = {
  repo: process.env.GITHUB_REPOSITORY ?? 'unknown',
  generatedAt: new Date().toISOString(),
  metrics: { issuesOpen: 0, prsOpen: 0 }    // まずはダミー
};

writeFileSync(resolve(outDir, 'dashboard.json'), JSON.stringify(data, null, 2));
console.log(`Generated ${resolve(outDir, 'dashboard.json')}`);
