// scripts/generate-dashboard-data.ts
// 1) .env / .env.local を読み込む（存在すれば）※CIではSecretsの環境変数が優先される
import 'dotenv/config';

import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Octokit } from '@octokit/rest';

const outDir = resolve('docs');
mkdirSync(outDir, { recursive: true });

// === Octokit セットアップ ===
const token = process.env.GITHUB_TOKEN || undefined; // 未設定でもOK（レートは厳しめ）
const repoFull = process.env.GITHUB_REPOSITORY ?? 'matsu8org/threadsWR';
const [owner, repo] = repoFull.split('/');
const octokit = token ? new Octokit({ auth: token }) : new Octokit();

// 検索件数（total_count）だけが欲しいときの軽量ヘルパ（非推奨APIを使わない）
async function searchCount(q: string): Promise<number> {
  const res = await octokit.request('GET /search/issues', {
    q,
    per_page: 1, // 件数のみ欲しいので最小
  });
  return res.data.total_count ?? 0;
}

async function fetchMetrics() {
  const repoQ = `repo:${owner}/${repo}`;

  // 1) 現在のオープン件数
  const issuesOpen = await searchCount(`${repoQ} is:issue is:open`);
  const prsOpen    = await searchCount(`${repoQ} is:pr is:open`);

  // 2) 直近7日の動き
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const issuesOpened7d = await searchCount(`${repoQ} is:issue created:>=${sevenDaysAgo}`);
  const issuesClosed7d = await searchCount(`${repoQ} is:issue closed:>=${sevenDaysAgo}`);
  const prsOpened7d    = await searchCount(`${repoQ} is:pr created:>=${sevenDaysAgo}`);
  const prsMerged7d    = await searchCount(`${repoQ} is:pr is:merged merged:>=${sevenDaysAgo}`);

  // 3) リポ情報（スター/フォーク等）
  const repoInfo = (await octokit.repos.get({ owner, repo })).data;
  const {
    stargazers_count: stars,
    forks_count: forks,
    watchers_count: watchers,
    open_issues_count,
  } = repoInfo;

  // 4) 直近ワークフロー実行（ざっくり成功/失敗）
  const runs = (await octokit.actions.listWorkflowRunsForRepo({
    owner, repo, per_page: 10,
  })).data.workflow_runs;
  const ciLast10 = {
    success: runs.filter(r => r.conclusion === 'success').length,
    failure: runs.filter(r => r.conclusion === 'failure').length,
  };

  return {
    issuesOpen,
    prsOpen,
    issuesOpened7d,
    issuesClosed7d,
    prsOpened7d,
    prsMerged7d,
    stars,
    forks,
    watchers,
    repoOpenIssuesField: open_issues_count, // Issue+PR混在の参考フィールド（GitHub集計）
    ciLast10,
  };
}

const metrics = await fetchMetrics();

const data = {
  repo: repoFull,
  generatedAt: new Date().toISOString(),
  metrics,
};

const outFile = resolve(outDir, 'dashboard-data.json');
writeFileSync(outFile, JSON.stringify(data, null, 2));
console.log(`Generated ${outFile}`);
