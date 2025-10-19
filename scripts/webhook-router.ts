// scripts/webhook-router.ts
// 最小ダミー：各イベントを受けても成功終了する（あとで本実装に差し替え可）

const event =
  process.argv[2] ??
  process.env.GITHUB_EVENT_NAME ??
  '';

function log(msg: string) {
  console.log(`[router] ${msg}`);
}

switch (event) {
  case 'push':
  case 'issues':
  case 'pull_request':
  case 'issue_comment':
    log(`${event} event: no-op (temporary)`);
    process.exit(0);
  default:
    log(`unknown or empty event "${event}", exit 0 for safety`);
    process.exit(0);
}
