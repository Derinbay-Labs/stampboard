// Active Claude Code sessions and their subagents, on this machine and (opt-in) on other machines over ssh.
// Reads only the small status files Claude Code keeps for each session (`~/.claude/sessions/<pid>.json`) and
// each subagent's `<id>.meta.json`; never a transcript, a prompt or an environment. The format is not a
// documented interface, so anything unexpected is skipped and the panel hides the section.

import { readdir, readFile, stat } from 'node:fs/promises';
import { execFile, spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const SUBAGENT_MAX_AGE_MS = 6 * 60 * 60 * 1000; // an unfinished subagent idle this long is treated as gone
const REMOTE_EVERY_MS = 30000;
const SSH_TIMEOUT_MS = 15000;
const MAX_OUTPUT = 1_000_000;
const PROCESS_NAMES = new Set(['claude', 'node']); // the native binary, or Node for an npm install

// Runs on the remote machine through `ssh <host> sh -s`. POSIX sh with BSD- and GNU-compatible tools only.
// A pid is live only if its process is still claude/node, so a reused pid does not show a ghost session.
// A plain template literal: `\${` keeps a shell `${`, and every sed backslash is doubled.
const PROBE = `
d="\${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
for f in "$d"/sessions/*.json; do
  [ -f "$f" ] || continue
  p=$(basename "$f" .json)
  case "$p" in ''|*[!0-9]*) continue ;; esac
  c=$(ps -o comm= -p "$p" 2>/dev/null) || continue
  c=\${c##*/}
  case "$c" in claude|node) ;; *) continue ;; esac
  echo "==S"
  cat "$f"
  echo
  sid=$(sed -n 's/.*"sessionId" *: *"\\([0-9A-Za-z-]*\\)".*/\\1/p' "$f" | head -n 1)
  [ -n "$sid" ] || continue
  for m in "$d"/projects/*/"$sid"/subagents/*.meta.json; do
    [ -f "$m" ] || continue
    grep -q '"finished" *: *true' "$m" && continue
    t="\${m%.meta.json}.jsonl"
    mt=$(stat -c %Y "$t" 2>/dev/null || stat -f %m "$t" 2>/dev/null || echo 0)
    echo "==A $sid $mt"
    cat "$m"
    echo
  done
done
`;

const str = (v, max = 120) => (typeof v === 'string' && v ? v.slice(0, max) : null);
function iso(v) {
  const n = typeof v === 'number' ? v : /^\d{10,}$/.test(String(v)) ? Number(v) : Date.parse(v);
  return Number.isFinite(n) && n > 0 ? new Date(n).toISOString() : null;
}
// The last two folders are enough to recognise a project; the full path would mostly repeat the home folder.
const cwdTail = (cwd) => (typeof cwd === 'string' ? cwd.split(/[\\/]+/).filter(Boolean).slice(-2).join('/') : null);

// Only these fields leave the server; the session id, socket paths and anything else stay behind.
function toSession(host, s, subs) {
  return {
    host,
    name: str(s.name) || cwdTail(s.cwd) || 'claude',
    agent: str(s.agent, 60),
    status: s.status === 'shell' ? 'busy' : str(s.status, 30) || 'unknown', // "shell": running a command
    cwd: cwdTail(s.cwd),
    startedAt: iso(s.startedAt),
    updatedAt: iso(s.statusUpdatedAt ?? s.updatedAt),
    subagents: subs
      .filter((a) => a.meta.finished !== true && a.mtimeMs && Date.now() - a.mtimeMs < SUBAGENT_MAX_AGE_MS)
      .map((a) => ({
        type: str(a.meta.agentType, 60) || 'agent',
        description: str(a.meta.description),
        model: str(a.meta.model, 40),
        background: a.meta.requestShape === 'background',
        updatedAt: iso(a.mtimeMs),
      }))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
  };
}

const parseJson = (text) => {
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? v : null;
  } catch {
    return null;
  }
};

// ---------- This machine ----------

const configDir = () => process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');

const run = (cmd, args) => new Promise((resolve) => {
  execFile(cmd, args, { windowsHide: true, timeout: 10000, maxBuffer: 4 * MAX_OUTPUT }, (err, stdout) => resolve(err ? '' : String(stdout)));
});

// pid -> process name without folder or .exe, for every process of this machine
async function processNames() {
  const names = new Map();
  if (process.platform === 'win32') {
    for (const line of (await run('tasklist', ['/FO', 'CSV', '/NH'])).split(/\r?\n/)) {
      const m = line.match(/^"([^"]+)","(\d+)"/);
      if (m) names.set(m[2], m[1].replace(/\.exe$/i, '').toLowerCase());
    }
  } else {
    for (const line of (await run('ps', ['-A', '-o', 'pid=,comm='])).split('\n')) {
      const m = line.trim().match(/^(\d+)\s+(.+)$/);
      if (m) names.set(m[1], m[2].split('/').pop().toLowerCase());
    }
  }
  return names;
}

const projectDirOf = new Map(); // session id -> its project folder, which never changes

async function localSubagents(dir, sid) {
  let base = projectDirOf.get(sid);
  if (!base) {
    const projects = await readdir(path.join(dir, 'projects')).catch(() => []);
    for (const p of projects) {
      const candidate = path.join(dir, 'projects', p, sid);
      if (await stat(candidate).then((s) => s.isDirectory(), () => false)) {
        base = candidate;
        projectDirOf.set(sid, base);
        break;
      }
    }
  }
  if (!base) return [];
  const subDir = path.join(base, 'subagents');
  const files = (await readdir(subDir).catch(() => [])).filter((f) => f.endsWith('.meta.json'));
  const out = [];
  for (const f of files) {
    const meta = parseJson(await readFile(path.join(subDir, f), 'utf8').catch(() => ''));
    if (!meta || meta.finished === true) continue;
    const mtimeMs = await stat(path.join(subDir, f.replace(/\.meta\.json$/, '.jsonl'))).then((s) => s.mtimeMs, () => 0);
    out.push({ meta, mtimeMs });
  }
  return out;
}

async function localSessions(host) {
  const dir = configDir();
  const files = (await readdir(path.join(dir, 'sessions')).catch(() => null))?.filter((f) => /^\d+\.json$/.test(f));
  if (!files) return null; // Claude Code is not used here
  if (!files.length) return [];
  const names = await processNames();
  const sessions = [];
  for (const f of files) {
    const pid = f.slice(0, -5);
    if (!PROCESS_NAMES.has(names.get(pid))) continue;
    const s = parseJson(await readFile(path.join(dir, 'sessions', f), 'utf8').catch(() => ''));
    if (!s) continue;
    const subs = typeof s.sessionId === 'string' && /^[\w-]+$/.test(s.sessionId) ? await localSubagents(dir, s.sessionId) : [];
    sessions.push(toSession(host, s, subs));
  }
  return sessions;
}

// ---------- Other machines over ssh ----------

function sshProbe(target) {
  return new Promise((resolve, reject) => {
    const child = spawn('ssh', ['-o', 'BatchMode=yes', '-o', 'ConnectTimeout=5', '--', target, 'sh', '-s'], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    let out = '';
    const timer = setTimeout(() => child.kill(), SSH_TIMEOUT_MS);
    child.stdout.on('data', (b) => {
      out += b;
      if (out.length > MAX_OUTPUT) child.kill();
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`ssh exited with ${code}`));
    });
    child.stdin.on('error', () => {});
    child.stdin.end(PROBE);
  });
}

// Output: "==S" + a session file, then "==A <session id> <mtime seconds>" + a subagent meta file per live subagent.
function parseProbe(host, text) {
  const sessions = [];
  let current = null;
  for (const block of text.split(/^==/m).slice(1)) {
    const nl = block.indexOf('\n');
    const head = (nl < 0 ? block : block.slice(0, nl)).trim().split(/\s+/);
    const body = parseJson(nl < 0 ? '' : block.slice(nl + 1));
    if (!body) continue;
    if (head[0] === 'S') {
      current = { s: body, subs: [] };
      sessions.push(current);
    } else if (head[0] === 'A' && current && head[1] === current.s.sessionId) {
      current.subs.push({ meta: body, mtimeMs: Number(head[2]) * 1000 || 0 });
    }
  }
  return sessions.map(({ s, subs }) => toSession(host, s, subs));
}

// ---------- Polling ----------

// config.agentHosts: ["jordan", { "name": "mac", "ssh": "me@mac.local" }]. The ssh target must already work
// with key authentication (BatchMode), because the panel never answers a password prompt.
export function agentHosts(list) {
  const hosts = [];
  for (const h of Array.isArray(list) ? list : []) {
    const ssh = typeof h === 'string' ? h : h && h.ssh;
    const name = (typeof h === 'object' && h && h.name) || ssh;
    if (typeof ssh !== 'string' || !/^[A-Za-z0-9_.@:[\]-]+$/.test(ssh) || ssh.startsWith('-')) {
      console.warn(`agentHosts: ignoring ${JSON.stringify(h)}; use a host name or user@host`);
      continue;
    }
    hosts.push({ name: String(name).slice(0, 40), ssh });
  }
  return hosts;
}

export function createAgentWatcher(config) {
  const localName = os.hostname().split('.')[0].toLowerCase();
  const hosts = agentHosts(config.agentHosts);
  const results = new Map(); // host name -> { name, ok, error, sessions, checkedAt }
  const inflight = new Map();
  const lastRemote = new Map();

  async function check(name, fetch) {
    if (inflight.has(name)) return inflight.get(name);
    const p = fetch()
      .then((sessions) => results.set(name, { name, ok: true, error: null, sessions: sessions || [], present: sessions !== null, checkedAt: new Date().toISOString() }))
      .catch((e) => {
        const prev = results.get(name);
        if (!prev || prev.ok) console.warn(`Agents on ${name}: ${e.message}`);
        results.set(name, { name, ok: false, error: 'unreachable', sessions: [], present: true, checkedAt: new Date().toISOString() });
      })
      .finally(() => inflight.delete(name));
    inflight.set(name, p);
    return p;
  }

  function tick() {
    check(localName, () => localSessions(localName));
    for (const h of hosts) {
      if (Date.now() - (lastRemote.get(h.name) || 0) < REMOTE_EVERY_MS) continue;
      lastRemote.set(h.name, Date.now());
      check(h.name, () => sshProbe(h.ssh).then((text) => parseProbe(h.name, text)));
    }
  }

  return {
    start(intervalMs) {
      tick();
      setInterval(tick, intervalMs).unref?.();
    },
    // Hosts with no Claude Code and no error are left out, so a machine without it shows nothing.
    snapshot() {
      const list = [...results.values()].filter((r) => r.present || !r.ok);
      return { hosts: list.map(({ name, ok, error, checkedAt }) => ({ name, ok, error, checkedAt })), sessions: list.flatMap((r) => r.sessions) };
    },
  };
}
