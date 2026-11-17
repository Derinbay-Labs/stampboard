import type { Lang } from "./types";

/** Strings of the product screen shown on the stage; the page renders it in its own locale. */
export interface ProductText {
  scope: string;
  running: string;
  queued: string;
  colRepo: string;
  colJob: string;
  colRunner: string;
  colTime: string;
  colStatus: string;
  head: (running: number, queued: number) => string;
  boardEmpty: string;
  sub: (repos: number, busy: string) => string;
  subIdle: (repos: number) => string;
  live: string;
  refresh: string;
  filterRunner: string;
  filterRepo: string;
  queuedSep: (n: number) => string;
  jobsDone: (done: number, total: number) => string;
  noJobs: string;
  awaitingRunner: string;
  awaitingApproval: string;
  prs: string;
  issues: string;
  agents: string;
  prSeals: Record<"ci" | "changes" | "approved", string>;
  securitySeal: string;
  ciPass: string;
  ciFailN: (n: number) => string;
  ciRun: string;
  ciNone: string;
  draft: string;
  review: Record<"approved" | "stale" | "changes" | "requested" | "pending", string>;
  prNote: Record<"ci" | "changes" | "approved", (n: number) => string>;
  bugs: (n: number) => string;
  assignee: (who: string) => string;
  ageUnits: [string, string, string];
  agBusy: string;
  agIdle: string;
  agBackground: string;
  agUnreachable: string;
  agSubs: (n: number) => string;
  seal: (s: string) => string;
  foot: string[];
  credit: string;
}

const en: ProductText = {
  scope: "acme",
  running: "Running",
  queued: "Queued",
  colRepo: "Repo",
  colJob: "Job",
  colRunner: "Runner",
  colTime: "Time",
  colStatus: "Status",
  head: (r, q) =>
    r && q
      ? `${r} jobs running, ${q} queued`
      : r
        ? `${r} ${r === 1 ? "job" : "jobs"} running, none queued`
        : "No running or queued jobs",
  boardEmpty: "The board is empty. Jobs appear here when a workflow starts.",
  sub: (n, b) => `Scanning ${n} repositories. Busy: ${b}.`,
  subIdle: (n) => `Scanning ${n} repositories.`,
  live: "Live, 1 s ago",
  refresh: "Refresh",
  filterRunner: "Runner",
  filterRepo: "Repo",
  queuedSep: (n) => `Queued, ${n} jobs`,
  jobsDone: (d, t) => `${d} of ${t} jobs done`,
  noJobs: "No jobs created yet",
  awaitingRunner: "Waiting for a runner",
  awaitingApproval: "Awaiting approval",
  prs: "Pull requests",
  issues: "Issues",
  agents: "Agents",
  prSeals: { ci: "CI broken", changes: "Changes", approved: "Approved" },
  securitySeal: "Security",
  ciPass: "CI passed",
  ciFailN: (n) => `${n} failed`,
  ciRun: "Running",
  ciNone: "No CI",
  draft: "Draft",
  review: {
    approved: "Approved",
    stale: "Approved an older commit",
    changes: "Changes requested",
    requested: "Review requested",
    pending: "Not reviewed",
  },
  prNote: {
    ci: (n) => `${n} CI broken`,
    changes: (n) => `${n} awaiting changes`,
    approved: (n) => `${n} ready to merge`,
  },
  bugs: (n) => `${n} bugs`,
  assignee: (a) => `assigned to ${a}`,
  ageUnits: ["m", "h", "d"],
  agBusy: "Working",
  agIdle: "Idle",
  agBackground: "background",
  agUnreachable: "Unreachable",
  agSubs: (n) => `${n} subagents`,
  seal: (s) => `Seal: ${s}`,
  foot: [
    "REST quota 4,870 / 5,000",
    "GraphQL quota 4,990 / 5,000",
    "Actions scan 1.2 s, every 10 s",
  ],
  credit: "Stampboard · Derinbay Labs",
};

const tr: ProductText = {
  scope: "acme",
  running: "Çalışıyor",
  queued: "Sırada",
  colRepo: "Repo",
  colJob: "Job",
  colRunner: "Runner",
  colTime: "Süre",
  colStatus: "Durum",
  head: (r, q) =>
    r && q
      ? `${r} job çalışıyor, ${q} job sırada`
      : r
        ? `${r} job çalışıyor, sırada bekleyen yok`
        : "Şu an çalışan ya da sıradaki job yok",
  boardEmpty: "Tabela boş. Bir workflow tetiklendiğinde job burada belirir.",
  sub: (n, b) => `${n} repo taranıyor. Meşgul runner: ${b}.`,
  subIdle: (n) => `${n} repo taranıyor.`,
  live: "Canlı, 1 sn önce",
  refresh: "Yenile",
  filterRunner: "Runner",
  filterRepo: "Repo",
  queuedSep: (n) => `Sırada, ${n} job`,
  jobsDone: (d, t) => `${d} / ${t} job bitti`,
  noJobs: "Job'lar henüz oluşmadı",
  awaitingRunner: "Runner bekleniyor",
  awaitingApproval: "Onay bekleniyor",
  prs: "Pull request'ler",
  issues: "Issue'lar",
  agents: "Ajanlar",
  prSeals: { ci: "CI kırık", changes: "Değişiklik", approved: "Onay" },
  securitySeal: "Güvenlik",
  ciPass: "CI geçti",
  ciFailN: (n) => `${n} kırık`,
  ciRun: "Çalışıyor",
  ciNone: "CI yok",
  draft: "Taslak",
  review: {
    approved: "Onaylı",
    stale: "Onay eski commit'te",
    changes: "Değişiklik istendi",
    requested: "İnceleme istendi",
    pending: "İncelenmedi",
  },
  prNote: {
    ci: (n) => `${n} CI kırık`,
    changes: (n) => `${n} değişiklik bekliyor`,
    approved: (n) => `${n} birleşmeye hazır`,
  },
  bugs: (n) => `${n} hata`,
  assignee: (a) => `atanan ${a}`,
  ageUnits: ["dk", "sa", "g"],
  agBusy: "Çalışıyor",
  agIdle: "Boşta",
  agBackground: "arka planda",
  agUnreachable: "Ulaşılamıyor",
  agSubs: (n) => `${n} alt ajan`,
  seal: (s) => `Mühür: ${s}`,
  foot: [
    "REST hakkı 4.870 / 5.000",
    "GraphQL hakkı 4.990 / 5.000",
    "Actions taraması 1,2 sn, 10 saniyede bir",
  ],
  credit: "Stampboard · Derinbay Labs",
};

const PRODUCT: Record<Lang, ProductText> = { en, tr };

export function productFor(lang: Lang): ProductText {
  return PRODUCT[lang];
}
