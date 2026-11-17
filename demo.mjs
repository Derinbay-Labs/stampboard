// Fixture data for `--demo`: a made-up organisation, so screenshots and contributors need no GitHub token.
// Times are relative to the moment of each request, so the board keeps ticking.

const OWNER = 'acme';
const gh = (p) => `https://github.com/${OWNER}/${p}`;
const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

function job(repo, runId, n, workflow, jobName, kind, o = {}) {
  const runner = o.runner ?? null;
  return {
    repo: `${OWNER}/${repo}`,
    repoUrl: gh(`${repo}/actions`),
    runId,
    runUrl: gh(`${repo}/actions/runs/${runId}`),
    workflow,
    runNumber: n,
    branch: o.branch ?? 'main',
    event: o.event ?? 'push',
    runDone: o.done ?? 0,
    runTotal: o.total ?? 1,
    runCreatedAt: ago(o.created ?? 5),
    runStartedAt: ago(o.created ?? 5),
    id: `${runId}/${jobName ?? '-'}`,
    kind,
    job: jobName,
    jobUrl: jobName ? gh(`${repo}/actions/runs/${runId}/job/1`) : null,
    runner,
    runnerGroup: runner ? (o.selfHosted ? 'Default' : 'GitHub Actions') : null,
    labels: o.labels ?? [],
    selfHosted: !!o.selfHosted,
    waitingApproval: !!o.approval,
    since: ago(o.since ?? 3),
  };
}

function pr(repo, number, title, o = {}) {
  return {
    repo: `${OWNER}/${repo}`,
    repoUrl: gh(repo),
    number,
    title,
    url: gh(`${repo}/pull/${number}`),
    author: o.author ?? 'dana',
    branch: o.branch ?? `feature/${number}`,
    draft: !!o.draft,
    labels: o.labels ?? [],
    createdAt: ago(o.updated + 600),
    updatedAt: ago(o.updated),
    ci: o.ci ?? { state: 'pass', failed: 0, total: 6 },
    review: o.review ?? { state: 'pending', by: [] },
    seal: o.seal ?? null,
  };
}

function issue(repo, number, title, o = {}) {
  return {
    repo: `${OWNER}/${repo}`,
    repoUrl: gh(repo),
    number,
    title,
    url: gh(`${repo}/issues/${number}`),
    author: o.author ?? 'sam',
    labels: o.labels ?? [],
    assignees: o.assignees ?? [],
    comments: o.comments ?? 0,
    createdAt: ago(o.updated + 2000),
    updatedAt: ago(o.updated),
    seal: o.seal ?? null,
  };
}

export function demoSnapshot() {
  const running = [
    job('api', 9101, 412, 'CI', 'test (go 1.26)', 'running', { runner: 'build-box', selfHosted: true, labels: ['self-hosted', 'linux'], done: 2, total: 5, created: 7, since: 4, branch: 'fix/session-timeout', event: 'pull_request' }),
    job('mobile', 9102, 88, 'iOS build', 'archive', 'running', { runner: 'mac-mini', selfHosted: true, labels: ['self-hosted', 'macOS'], done: 1, total: 3, created: 6, since: 5 }),
    job('web', 9103, 230, 'Preview deploy', 'build', 'running', { runner: 'GitHub Actions 1000042', labels: ['ubuntu-latest'], created: 2, since: 1, branch: 'feat/billing-page', event: 'pull_request' }),
  ];
  const queued = [
    job('mobile', 9104, 89, 'Android build', 'assembleRelease', 'queued', { labels: ['self-hosted', 'linux'], created: 3, since: 3 }),
    job('docs', 9105, 57, 'Publish', null, 'queued', { created: 1, since: 1 }),
    job('api', 9106, 413, 'Release', 'publish', 'queued', { labels: ['ubuntu-latest'], approval: true, created: 1, since: 1, branch: 'v2.4.0', event: 'release' }),
  ];
  const prs = [
    pr('api', 318, 'Expire idle sessions after 30 minutes', { updated: 12, ci: { state: 'fail', failed: 2, total: 6 }, seal: 'ci', branch: 'fix/session-timeout', labels: ['bug'] }),
    pr('web', 141, 'Billing page with invoice history', { updated: 45, review: { state: 'changes', by: ['lee'] }, seal: 'changes', author: 'kim', branch: 'feat/billing-page' }),
    pr('mobile', 77, 'Offline queue for uploads', { updated: 90, review: { state: 'requested', by: [] }, ci: { state: 'running', failed: 0, total: 4 }, author: 'lee' }),
    pr('docs', 52, 'Document the rate limit headers', { updated: 300, review: { state: 'stale', by: ['dana'] }, author: 'sam' }),
    pr('api', 315, 'Add pagination to the audit log', { updated: 1500, review: { state: 'approved', by: ['kim'] }, seal: 'approved', labels: ['enhancement'] }),
    pr('web', 139, 'Try the new chart library', { updated: 4000, draft: true, ci: { state: 'none', failed: 0, total: 0 }, author: 'kim' }),
    pr('billing', 64, 'Prorate plan changes mid-cycle', { updated: 25, review: { state: 'requested', by: [] }, author: 'lee', branch: 'feat/proration' }),
    pr('infra', 211, 'Move the runners to the new subnet', { updated: 60, ci: { state: 'running', failed: 0, total: 3 }, author: 'dana', labels: ['infra'] }),
    pr('auth', 37, 'Rotate signing keys every 90 days', { updated: 200, review: { state: 'approved', by: ['dana'] }, seal: 'approved', author: 'sam' }),
    pr('search', 19, 'Index archived projects', { updated: 700, author: 'kim' }),
    pr('cli', 103, 'Add a --json flag to status', { updated: 1100, review: { state: 'requested', by: [] }, author: 'lee' }),
    pr('design-system', 48, 'Tabular numerals in data tables', { updated: 2600, author: 'kim', labels: ['design'] }),
    pr('api', 319, 'Retry webhook delivery with backoff', { updated: 8, ci: { state: 'running', failed: 0, total: 6 }, author: 'dana', branch: 'feat/webhook-retry' }),
    pr('mobile', 79, 'Pull to refresh on the inbox', { updated: 3100, author: 'lee' }),
  ];
  const issues = [
    issue('api', 320, 'Session token is logged at debug level', { updated: 30, labels: ['security'], seal: 'security', assignees: ['dana'], comments: 3 }),
    issue('mobile', 80, 'Crash when the camera permission is denied', { updated: 120, labels: ['bug'], comments: 5, assignees: ['lee'] }),
    issue('web', 144, 'Dark mode contrast on the settings page', { updated: 400, labels: ['bug', 'design'], comments: 1 }),
    issue('docs', 55, 'Add a quick start for self-hosted runners', { updated: 2000, labels: ['documentation'] }),
    issue('api', 301, 'Support webhooks for invoice events', { updated: 9000, labels: ['enhancement'], comments: 8 }),
    issue('billing', 66, 'Choose how to round prorated amounts', { updated: 50, labels: ['decision'], seal: 'decision', comments: 4 }),
    issue('infra', 214, 'Runner disk fills up after nightly builds', { updated: 180, labels: ['bug'], assignees: ['dana'], comments: 2 }),
    issue('auth', 40, 'Password reset link expires too early', { updated: 800, labels: ['bug'] }),
    issue('search', 22, 'Typo tolerance for repository names', { updated: 3000, labels: ['enhancement'] }),
    issue('cli', 105, 'Shell completion for zsh', { updated: 5000, labels: ['enhancement'], comments: 1 }),
    issue('web', 146, 'Empty state for the invoices table', { updated: 6000, labels: ['design'] }),
  ];
  const now = new Date().toISOString();
  return {
    loading: false,
    updatedAt: now,
    checkedAt: now,
    tookMs: 1240,
    owners: [OWNER],
    repoCount: 10,
    skipped: 0,
    intervalSeconds: 10,
    rate: { limit: 5000, remaining: 4870, reset: null },
    error: null,
    running,
    queued,
    work: {
      loading: false,
      updatedAt: now,
      checkedAt: now,
      tookMs: 820,
      error: null,
      rate: { remaining: 4990, limit: 5000, resetAt: null },
      prTotal: prs.length,
      issueTotal: issues.length,
      prs,
      issues,
    },
    agents: {
      hosts: [
        { name: 'laptop', ok: true, error: null, checkedAt: now },
        { name: 'build-box', ok: true, error: null, checkedAt: now },
      ],
      sessions: [
        {
          host: 'laptop', name: 'invoice-webhooks', agent: null, status: 'busy', cwd: 'acme/api',
          startedAt: ago(42), updatedAt: ago(0.2),
          subagents: [
            { type: 'Explore', description: 'Find webhook retry code', model: null, background: false, updatedAt: ago(0.5) },
            { type: 'code-reviewer', description: 'Review the webhook PR', model: 'sonnet', background: true, updatedAt: ago(3) },
          ],
        },
        { host: 'laptop', name: 'docs-quick-start', agent: null, status: 'idle', cwd: 'acme/docs', startedAt: ago(180), updatedAt: ago(25), subagents: [] },
        {
          host: 'build-box', name: 'release-lead', agent: 'team-lead', status: 'busy', cwd: 'acme/web', startedAt: ago(95), updatedAt: ago(1),
          subagents: [
            { type: 'web-developer', description: 'Billing page empty states', model: 'sonnet', background: true, updatedAt: ago(1) },
            { type: 'web-developer', description: 'Invoice table pagination', model: 'sonnet', background: true, updatedAt: ago(2) },
            { type: 'backend-developer', description: 'Proration endpoint', model: 'sonnet', background: true, updatedAt: ago(1) },
            { type: 'code-reviewer', description: 'Review billing PR #141', model: 'opus', background: false, updatedAt: ago(4) },
            { type: 'qa-engineer', description: 'Verify the billing slice', model: 'sonnet', background: true, updatedAt: ago(6) },
            { type: 'Explore', description: 'Find the chart library usages', model: null, background: false, updatedAt: ago(8) },
            { type: 'ux-designer', description: 'Invoice history spec', model: 'opus', background: true, updatedAt: ago(9) },
          ],
        },
        { host: 'build-box', name: 'infra-runners', agent: null, status: 'idle', cwd: 'acme/infra', startedAt: ago(300), updatedAt: ago(40), subagents: [] },
      ],
    },
    now,
  };
}
