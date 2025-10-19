// scripts/cicd/webhook-router.ts
// CI/CD向けの薄いルーター。まずは“落ちない”ことを最優先にNo-Opで成功終了。
// 後で handlers を生やして本実装に差し替える。

const eventArg =
  process.argv[2] ??
  process.env.GITHUB_EVENT_NAME ??
  '';

function log(msg: string) {
  console.log(`[router] ${msg}`);
}

switch (eventArg) {
  case 'push':
  case 'issues':
  case 'pull_request':
  case 'issue_comment':
    log(`${eventArg} event: no-op (temporary)`);
    process.exit(0);
  default:
    log(`unknown or empty event "${eventArg}", exit 0 for safety`);
    process.exit(0);
}
