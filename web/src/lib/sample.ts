/**
 * Made-up sample data for the product screen, copied from `demo.mjs` (organisation "acme").
 * Never real repository names. Times are minutes ago, so the page is deterministic.
 */
export interface Job {
  repo: string;
  workflow: string;
  n: number;
  job: string | null;
  kind: "running" | "queued";
  runner: string | null;
  selfHosted: boolean;
  labels: string[];
  done: number;
  total: number;
  branch: string;
  approval: boolean;
  since: number;
}
export interface Pr {
  repo: string;
  number: number;
  title: string;
  author: string;
  branch: string;
  labels: string[];
  ci: { state: "pass" | "fail" | "running" | "none"; failed?: number };
  review: "approved" | "stale" | "changes" | "requested" | "pending";
  seal?: "ci" | "changes" | "approved";
  draft?: boolean;
  updated: number;
}
export interface Issue {
  repo: string;
  number: number;
  title: string;
  author: string;
  labels: string[];
  assignees: string[];
  comments: number;
  seal?: "security";
  updated: number;
}
export interface Session {
  host: string;
  name: string;
  agent?: string;
  status: "busy" | "idle";
  cwd: string;
  updated: number;
  subs: { type: string; model?: string; d: string; bg?: boolean }[];
}
export interface Scene {
  running: Job[];
  queued: Job[];
  prs: Pr[];
  issues: Issue[];
  sessions: Session[];
  downHosts: string[];
}

interface JobOpts {
  runner?: string;
  selfHosted?: boolean;
  labels?: string[];
  done?: number;
  total?: number;
  branch?: string;
  approval?: boolean;
  since?: number;
}
function job(
  repo: string,
  workflow: string,
  n: number,
  name: string | null,
  kind: Job["kind"],
  o: JobOpts = {},
): Job {
  return {
    repo,
    workflow,
    n,
    job: name,
    kind,
    runner: o.runner ?? null,
    selfHosted: !!o.selfHosted,
    labels: o.labels ?? [],
    done: o.done ?? 0,
    total: o.total ?? 1,
    branch: o.branch ?? "main",
    approval: !!o.approval,
    since: o.since ?? 1,
  };
}

const running: Job[] = [
  job("api", "CI", 412, "test (go 1.26)", "running", {
    runner: "build-box",
    selfHosted: true,
    done: 2,
    total: 5,
    since: 4,
    branch: "fix/session-timeout",
  }),
  job("mobile", "iOS build", 88, "archive", "running", {
    runner: "mac-mini",
    selfHosted: true,
    done: 1,
    total: 3,
    since: 5,
  }),
  job("web", "Preview deploy", 230, "build", "running", {
    runner: "GitHub Actions 1000042",
    since: 1,
    branch: "feat/billing-page",
  }),
];
const queued: Job[] = [
  job("mobile", "Android build", 89, "assembleRelease", "queued", {
    labels: ["self-hosted", "linux"],
    since: 3,
  }),
  job("docs", "Publish", 57, null, "queued", { since: 1 }),
  job("api", "Release", 413, "publish", "queued", {
    labels: ["ubuntu-latest"],
    approval: true,
    since: 1,
    branch: "v2.4.0",
  }),
];
const prs: Pr[] = [
  {
    repo: "api",
    number: 318,
    title: "Expire idle sessions after 30 minutes",
    author: "dana",
    branch: "fix/session-timeout",
    labels: ["bug"],
    ci: { state: "fail", failed: 2 },
    review: "pending",
    seal: "ci",
    updated: 12,
  },
  {
    repo: "web",
    number: 141,
    title: "Billing page with invoice history",
    author: "kim",
    branch: "feat/billing-page",
    labels: [],
    ci: { state: "pass" },
    review: "changes",
    seal: "changes",
    updated: 45,
  },
  {
    repo: "mobile",
    number: 77,
    title: "Offline queue for uploads",
    author: "lee",
    branch: "feature/77",
    labels: [],
    ci: { state: "running" },
    review: "requested",
    updated: 90,
  },
  {
    repo: "docs",
    number: 52,
    title: "Document the rate limit headers",
    author: "sam",
    branch: "feature/52",
    labels: [],
    ci: { state: "pass" },
    review: "stale",
    updated: 300,
  },
  {
    repo: "api",
    number: 315,
    title: "Add pagination to the audit log",
    author: "dana",
    branch: "feature/315",
    labels: ["enhancement"],
    ci: { state: "pass" },
    review: "approved",
    seal: "approved",
    updated: 1500,
  },
  {
    repo: "web",
    number: 139,
    title: "Try the new chart library",
    author: "kim",
    branch: "feature/139",
    labels: [],
    ci: { state: "none" },
    review: "pending",
    draft: true,
    updated: 4000,
  },
];
const issues: Issue[] = [
  {
    repo: "api",
    number: 320,
    title: "Session token is logged at debug level",
    author: "sam",
    labels: ["security"],
    assignees: ["dana"],
    comments: 3,
    seal: "security",
    updated: 30,
  },
  {
    repo: "mobile",
    number: 80,
    title: "Crash when the camera permission is denied",
    author: "sam",
    labels: ["bug"],
    assignees: ["lee"],
    comments: 5,
    updated: 120,
  },
  {
    repo: "web",
    number: 144,
    title: "Dark mode contrast on the settings page",
    author: "sam",
    labels: ["bug", "design"],
    assignees: [],
    comments: 1,
    updated: 400,
  },
  {
    repo: "docs",
    number: 55,
    title: "Add a quick start for self-hosted runners",
    author: "sam",
    labels: ["documentation"],
    assignees: [],
    comments: 0,
    updated: 2000,
  },
  {
    repo: "api",
    number: 301,
    title: "Support webhooks for invoice events",
    author: "sam",
    labels: ["enhancement"],
    assignees: [],
    comments: 8,
    updated: 9000,
  },
];
const sessions: Session[] = [
  {
    host: "laptop",
    name: "invoice-webhooks",
    status: "busy",
    cwd: "acme/api",
    updated: 0,
    subs: [
      { type: "Explore", d: "Find webhook retry code" },
      { type: "code-reviewer", model: "sonnet", d: "Review the webhook PR", bg: true },
    ],
  },
  {
    host: "build-box",
    name: "release-lead",
    agent: "team-lead",
    status: "busy",
    cwd: "acme/web",
    updated: 1,
    subs: [],
  },
  {
    host: "laptop",
    name: "docs-quick-start",
    status: "idle",
    cwd: "acme/docs",
    updated: 25,
    subs: [],
  },
];
const moreSessions: Session[] = [
  ...sessions,
  {
    host: "mac-studio",
    name: "ios-release-notes",
    status: "busy",
    cwd: "acme/mobile",
    updated: 2,
    subs: [{ type: "general-purpose", d: "Draft the 2.4 release notes" }],
  },
];

export type SceneId = "morning" | "quiet" | "hosts";
export const SCENE_IDS: readonly SceneId[] = ["morning", "quiet", "hosts"];

export const MORNING: Scene = { running, queued, prs, issues, sessions, downHosts: [] };

export const SCENES: Record<SceneId, Scene> = {
  morning: MORNING,
  quiet: {
    running: [],
    queued: [queued[1]!],
    prs: [prs[4]!, prs[3]!],
    issues: [issues[3]!],
    sessions: [],
    downHosts: [],
  },
  hosts: { ...MORNING, sessions: moreSessions, downHosts: ["nas"] },
};

/** Close-up 1: three pull requests, two of them sealed. */
export const CLOSE_PRS: Scene = { ...MORNING, prs: [prs[0]!, prs[1]!, prs[4]!] };
/** Close-up 3: one more machine and an unreachable host. */
export const CLOSE_AGENTS: Scene = {
  ...MORNING,
  sessions: moreSessions.slice(2),
  downHosts: ["nas"],
};
/** Close-up 2: the runner plates. */
export const PLATE_RUNNERS = ["build-box", "mac-mini"] as const;
