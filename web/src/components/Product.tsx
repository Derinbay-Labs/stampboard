import type { CSSProperties, ReactNode } from "react";
import type { ProductText } from "@/content/product";
import type { Lang } from "@/content/types";
import { age, hue } from "@/lib/format";
import type { Issue, Job, Pr, Scene, Session } from "@/lib/sample";
import { Elapsed, WallClock } from "./Timers";

/**
 * The Stampboard page itself, rendered from sample data. A port of the product's own
 * `index.html` (scoped under `.sb`); strings come from `content/product.ts`.
 */
export interface View {
  t: ProductText;
  lang: Lang;
}
export type Part = "board" | "sealrow" | "agents";

const lit = (part: string, active: Part | null | undefined) =>
  active && part === active ? " is-lit" : "";

function Svg({ size = 14, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
const Branch = () => (
  <Svg size={12}>
    <circle cx="4.5" cy="3.5" r="1.7" />
    <circle cx="4.5" cy="12.5" r="1.7" />
    <circle cx="11.5" cy="5.5" r="1.7" />
    <path d="M4.5 5.2v5.6M11.5 7.2c0 2.6-3 2.2-7 3.6" />
  </Svg>
);
const Pass = () => (
  <Svg>
    <circle cx="8" cy="8" r="6.3" />
    <path d="m5.3 8.2 1.9 1.9 3.6-3.9" />
  </Svg>
);
const Fail = () => (
  <Svg>
    <circle cx="8" cy="8" r="6.3" />
    <path d="m5.8 5.8 4.4 4.4M10.2 5.8l-4.4 4.4" />
  </Svg>
);
const Run = () => (
  <Svg>
    <circle cx="8" cy="8" r="6.3" opacity=".35" />
    <path d="M8 1.7a6.3 6.3 0 0 1 6.3 6.3" />
    <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
  </Svg>
);
const None = () => (
  <Svg>
    <circle cx="8" cy="8" r="6.3" strokeDasharray="2.2 2.4" />
  </Svg>
);
const Comment = () => (
  <Svg size={13}>
    <path d="M2.5 3.5h11v7.2H8l-3 2.6v-2.6H2.5z" />
  </Svg>
);
const Person = () => (
  <Svg size={12}>
    <circle cx="8" cy="5.5" r="2.6" />
    <path d="M3 13.5c.7-2.5 2.7-3.8 5-3.8s4.3 1.3 5 3.8" />
  </Svg>
);

const runnerKey = (it: Job) =>
  it.runner ? (it.selfHosted ? it.runner : "GitHub-hosted") : null;

/** A runner plate: self-hosted runners get their own colour, GitHub-hosted ones an outline. */
export function Plate({ name, hosted }: { name: string; hosted?: boolean }) {
  return (
    <span
      lang="en"
      className={`plate${hosted ? " hosted" : ""}`}
      style={hosted ? undefined : ({ "--h": hue(name) } as CSSProperties)}
    >
      <i />
      <span>{hosted ? "GitHub-hosted" : name}</span>
    </span>
  );
}

function RunnerCell({ it, v }: { it: Job; v: View }) {
  if (it.kind === "running") {
    return it.selfHosted ? <Plate name={it.runner ?? ""} /> : <Plate name="" hosted />;
  }
  return (
    <>
      <span className="waiting">{it.approval ? v.t.awaitingApproval : v.t.awaitingRunner}</span>
      {it.labels.length ? <span className="labels">{it.labels.join(" ")}</span> : null}
    </>
  );
}

function DepRow({ it, v }: { it: Job; v: View }) {
  const running = it.kind === "running";
  return (
    <tr>
      <td>
        <span
          className={`lamp ${running ? "run" : "wait"}`}
          role="img"
          aria-label={running ? v.t.running : v.t.queued}
        />
      </td>
      <td className="d-repo">{it.repo}</td>
      <td className="d-job">
        <span className="job">{it.job ?? it.workflow}</span>
        <div className="d-meta">
          <span>
            {it.workflow} #{it.n}
          </span>
          <span>
            <Branch />
            {it.branch}
          </span>
          {it.job && it.total > 1 ? <span>{v.t.jobsDone(it.done, it.total)}</span> : null}
          {it.job ? null : <span>{v.t.noJobs}</span>}
        </div>
      </td>
      <td className="d-runner-col">
        <RunnerCell it={it} v={v} />
      </td>
      <td>
        <span className={`d-time mono${running ? "" : " wait-t"}`}>
          <Elapsed sinceMin={it.since} />
        </span>
      </td>
    </tr>
  );
}

function Chips({ jobs, v }: { jobs: Job[]; v: View }) {
  const count = (key: (it: Job) => string | null) => {
    const m = new Map<string, number>();
    for (const it of jobs) {
      const k = key(it);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m];
  };
  const runners = count((it) => (it.kind === "running" ? runnerKey(it) : null));
  const repos = count((it) => it.repo);
  const row = (label: string, entries: [string, number][]) => (
    <div className="frow">
      <span className="flabel">{label}</span>
      {entries.map(([name, n]) => (
        <span className="chip" key={name}>
          {name}
          <b>{n}</b>
        </span>
      ))}
    </div>
  );
  return (
    <>
      {row(v.t.filterRunner, runners)}
      {row(v.t.filterRepo, repos)}
    </>
  );
}

export function Board({ scene, v, hl }: { scene: Scene; v: View; hl?: Part | null }) {
  const { running, queued } = scene;
  const busy = [...new Set(running.map(runnerKey))].join(", ") || "-";
  const has = running.length + queued.length > 0;
  return (
    <section
      className={`board${lit("board", hl)}`}
      data-part="board"
      aria-label="GitHub Actions"
    >
      <div className="b-head">
        <div>
          <div className="brand">
            <span className="brand-name">Stampboard</span>
            <span className="brand-scope">{v.t.scope}</span>
          </div>
          <p className="b-h">{v.t.head(running.length, queued.length)}</p>
          <p className="sub">{running.length ? v.t.sub(4, busy) : v.t.subIdle(4)}</p>
        </div>
        <div className="b-side">
          <div className="clock mono" aria-hidden="true">
            <WallClock />
          </div>
          <div className="tools" aria-hidden="true">
            <span className="live">
              <i />
              {v.t.live}
            </span>
            <span className="fake-btn">{v.t.refresh}</span>
          </div>
        </div>
      </div>
      {has ? (
        <div className="filters">
          <Chips jobs={[...running, ...queued]} v={v} />
        </div>
      ) : null}
      <div className="departures">
        {has ? (
          <table>
            <thead>
              <tr>
                <th>
                  <span className="sr-only">{v.t.colStatus}</span>
                </th>
                <th>{v.t.colRepo}</th>
                <th>{v.t.colJob}</th>
                <th className="d-runner-col">{v.t.colRunner}</th>
                <th>{v.t.colTime}</th>
              </tr>
            </thead>
            <tbody>
              {running.map((it) => (
                <DepRow key={`r${it.repo}${it.n}`} it={it} v={v} />
              ))}
              {running.length && queued.length ? (
                <tr className="d-sep">
                  <td colSpan={5}>{v.t.queuedSep(queued.length)}</td>
                </tr>
              ) : null}
              {queued.map((it) => (
                <DepRow key={`q${it.repo}${it.n}`} it={it} v={v} />
              ))}
            </tbody>
          </table>
        ) : (
          <p className="b-empty">{v.t.boardEmpty}</p>
        )}
      </div>
    </section>
  );
}

function Seal({ text, v }: { text?: string; v: View }) {
  if (!text) return <span />;
  return (
    <span className="seal fresh" role="img" aria-label={v.t.seal(text)}>
      {text}
    </span>
  );
}

function CiCell({ ci, v }: { ci: Pr["ci"]; v: View }) {
  if (ci.state === "pass")
    return (
      <span className="state st-pass">
        <Pass />
        {v.t.ciPass}
      </span>
    );
  if (ci.state === "fail")
    return (
      <span className="state st-fail">
        <Fail />
        {v.t.ciFailN(ci.failed ?? 0)}
      </span>
    );
  if (ci.state === "running")
    return (
      <span className="state st-run">
        <Run />
        {v.t.ciRun}
      </span>
    );
  return (
    <span className="state st-quiet">
      <None />
      {v.t.ciNone}
    </span>
  );
}

const Ref = ({ repo, n }: { repo: string; n: number }) => (
  <span className="e-ref mono">
    <b>{repo}</b>#{n}
  </span>
);

function PrEntry({ p, v, hl }: { p: Pr; v: View; hl?: Part | null }) {
  const part = p.seal ? "sealrow" : "row";
  const rev = p.draft ? v.t.draft : v.t.review[p.review];
  const CLS: Partial<Record<Pr["review"], string>> = {
    approved: "st-pass",
    changes: "st-fail",
  };
  const cls = p.draft ? "st-quiet" : (CLS[p.review] ?? "st-quiet");
  return (
    <li
      className={`entry${p.seal ? " sealed" : ""}${p.draft ? " draft" : ""}${lit(part, hl)}`}
      data-part={part}
    >
      <div className="e-title">
        <span className="t">{p.title}</span>
        <div className="e-meta">
          <Ref repo={p.repo} n={p.number} />
          <span>
            <Person />
            {p.author}
          </span>
          <span className="mono">
            <Branch />
            {p.branch}
          </span>
          {p.labels.length ? <span className="mono">{p.labels.join(" · ")}</span> : null}
        </div>
      </div>
      <div>
        <CiCell ci={p.ci} v={v} />
      </div>
      <div className="e-rev">
        <span className={`state ${cls}`}>{rev}</span>
      </div>
      <Seal text={p.seal && v.t.prSeals[p.seal]} v={v} />
      <span className="e-age mono">{age(p.updated, v.t.ageUnits)}</span>
    </li>
  );
}

export function PrLedger({ prs, v, hl }: { prs: Pr[]; v: View; hl?: Part | null }) {
  const shown = prs.slice(0, 6);
  const c = (k: string) => shown.filter((p) => p.seal === k).length;
  const kinds = (["ci", "changes", "approved"] as const).filter((k) => c(k));
  return (
    <section className="ledger pr" data-part="prs">
      <div className="l-head">
        <h3>{v.t.prs}</h3>
        <span className="l-count">{prs.length}</span>
        <span className="l-note">
          {kinds.map((k, i) => (
            <span key={k}>
              {i ? ", " : ""}
              {k === "approved" ? v.t.prNote[k](c(k)) : <b>{v.t.prNote[k](c(k))}</b>}
            </span>
          ))}
        </span>
      </div>
      <ol>
        {shown.map((p) => (
          <PrEntry key={`${p.repo}${p.number}`} p={p} v={v} hl={hl} />
        ))}
      </ol>
    </section>
  );
}

function IssueEntry({ i, v, hl }: { i: Issue; v: View; hl?: Part | null }) {
  const part = i.seal ? "sealrow" : "row";
  return (
    <li className={`entry${i.seal ? " sealed" : ""}${lit(part, hl)}`} data-part={part}>
      <div className="e-title">
        <span className="t">{i.title}</span>
        <div className="e-meta">
          <Ref repo={i.repo} n={i.number} />
          <span>
            <Person />
            {i.author}
          </span>
          <span className="mono">{i.labels.join(" · ")}</span>
          {i.assignees.length ? <span>{v.t.assignee(i.assignees.join(", "))}</span> : null}
        </div>
      </div>
      <span className="e-com mono">
        {i.comments ? (
          <>
            <Comment />
            {i.comments}
          </>
        ) : null}
      </span>
      <Seal text={i.seal && v.t.securitySeal} v={v} />
      <span className="e-age mono">{age(i.updated, v.t.ageUnits)}</span>
    </li>
  );
}

export function IssueLedger({ issues, v, hl }: { issues: Issue[]; v: View; hl?: Part | null }) {
  const shown = issues.slice(0, 5);
  const bugs = shown.filter((i) => i.labels.includes("bug")).length;
  const sec = shown.filter((i) => i.seal === "security").length;
  return (
    <section className="ledger is" data-part="issues">
      <div className="l-head">
        <h3>{v.t.issues}</h3>
        <span className="l-count">{issues.length}</span>
        <span className="l-note">
          {sec ? <b>{`${sec} ${v.t.securitySeal.toLocaleLowerCase(v.lang)}`}</b> : null}
          {sec && bugs ? ", " : ""}
          {bugs ? v.t.bugs(bugs) : null}
        </span>
      </div>
      <ol>
        {shown.map((i) => (
          <IssueEntry key={`${i.repo}${i.number}`} i={i} v={v} hl={hl} />
        ))}
      </ol>
    </section>
  );
}

function AgentEntry({ a, v }: { a: Session; v: View }) {
  const busy = a.status === "busy";
  return (
    <li className="entry">
      <div className="e-title">
        <span className="e-name">{a.name}</span>
        <div className="e-meta">
          <span className="e-ref mono">
            <b>{a.host}</b>
          </span>
          {a.agent ? (
            <span>
              <Person />
              {a.agent}
            </span>
          ) : null}
          <span className="mono">{a.cwd}</span>
        </div>
        {a.subs.length ? (
          <ul className="ag-subs" aria-label={v.t.agSubs(a.subs.length)}>
            {a.subs.map((s) => (
              <li key={s.type + s.d}>
                <span className="mono">
                  {s.type}
                  {s.model ? <i> · {s.model}</i> : null}
                </span>
                <span>
                  {s.d}
                  {s.bg ? ` (${v.t.agBackground})` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <span className={`state ${busy ? "st-run" : "st-quiet"}`}>
        {busy ? <Run /> : <None />}
        {busy ? v.t.agBusy : v.t.agIdle}
      </span>
      <span className="e-age mono">{age(a.updated, v.t.ageUnits)}</span>
    </li>
  );
}

export function AgentsSheet({
  sessions,
  down,
  v,
  hl,
}: {
  sessions: Session[];
  down: string[];
  v: View;
  hl?: Part | null;
}) {
  return (
    <section className={`ledger ag${lit("agents", hl)}`} data-part="agents">
      <div className="l-head">
        <h3>{v.t.agents}</h3>
        <span className="l-count">{sessions.length}</span>
        <span className="l-note">
          {down.length ? (
            <b>
              {v.t.agUnreachable}: {down.join(", ")}
            </b>
          ) : null}
        </span>
      </div>
      <ol>
        {sessions.map((a) => (
          <AgentEntry key={a.host + a.name} a={a} v={v} />
        ))}
      </ol>
    </section>
  );
}

/** The whole page, as the product draws it. The agents sheet hides itself when none run. */
export function SbApp({
  scene,
  v,
  hl,
  foot = true,
}: {
  scene: Scene;
  v: View;
  hl?: Part | null;
  foot?: boolean;
}) {
  const showAgents = scene.sessions.length > 0 || scene.downHosts.length > 0;
  return (
    <div className="sb-app">
      <Board scene={scene} v={v} hl={hl} />
      {showAgents ? (
        <AgentsSheet sessions={scene.sessions} down={scene.downHosts} v={v} hl={hl} />
      ) : null}
      <div className="ledgers">
        <PrLedger prs={scene.prs} v={v} hl={hl} />
        <IssueLedger issues={scene.issues} v={v} hl={hl} />
      </div>
      {foot ? (
        <div className="sb-foot">
          {v.t.foot.map((f) => (
            <span key={f}>{f}</span>
          ))}
          <span className="credit">{v.t.credit}</span>
        </div>
      ) : null}
    </div>
  );
}
