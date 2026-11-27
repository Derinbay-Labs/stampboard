// Unit tests for the pure layout maths in index.html (the block between the <layout-math> markers).
// Run: node --test test/*.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const m = html.match(/\/\/ <layout-math>\n([\s\S]*?)\/\/ <\/layout-math>/);
assert.ok(m, 'layout-math markers present in index.html');
const names = 'flexSizes fractions enlargeStack enlargeLedger stateFromMeasure foldKey unfoldKey withSizes sanitizeState sumN';
const api = vm.runInNewContext(`${m[1]}\n({ ${names.split(' ').join(', ')} })`);
const { flexSizes, fractions, enlargeStack, enlargeLedger, stateFromMeasure, foldKey, unfoldKey, withSizes, sanitizeState, sumN } = api;
const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const sum1 = (o) => sumN(Object.values(o).filter((v) => v > 0));

test('fractions sum to one', () => {
  const f = fractions([300, 100, 100]);
  close(sumN(f), 1, 1e-9);
  close(f[0], 0.6, 1e-9);
});

test('flexSizes shares by weight and honours floors and caps', () => {
  const s = flexSizes(1000, [{ w: 1, min: 0, max: 1e9 }, { w: 1, min: 0, max: 1e9 }]);
  close(s[0], 500); close(s[1], 500);
  const f = flexSizes(1000, [{ w: 9, min: 0, max: 300 }, { w: 1, min: 0, max: 1e9 }]); // cap pins the first, the rest shares again
  close(f[0], 300); close(f[1], 700);
  const g = flexSizes(1000, [{ w: 1, min: 0, max: 1e9 }, { w: 9, min: 0, max: 1e9 }, { w: 1, min: 200, max: 1e9 }]);
  close(sumN(g), 1000); assert.ok(g[2] >= 200);
});

test('enlarging a stack item doubles it and the others keep proportions', () => {
  const r = enlargeStack(1000, [{ size: 200, min: 100, max: 1000 }, { size: 400, min: 100, max: 1000 }, { size: 400, min: 100, max: 1000 }], 0);
  close(r[0], 400); close(r[1], 300); close(r[2], 300); close(sumN(r), 1000);
});

test('enlarging stops at the content cap and the others floors', () => {
  const capped = enlargeStack(1000, [{ size: 300, min: 100, max: 450 }, { size: 700, min: 100, max: 1000 }], 0);
  close(capped[0], 450); close(sumN(capped), 1000);
  const floored = enlargeStack(1000, [{ size: 500, min: 100, max: 2000 }, { size: 500, min: 400, max: 1000 }], 0);
  close(floored[0], 600); close(floored[1], 400);
});

test('enlarging a ledger doubles its area, siblings keep their area ratio, floors hold', () => {
  const c = { total: 1000, W: 1800, hb: 400, hg: 200, hl: 400, wx: 880, ws: 900, spine: 56, fb: 200, fg: 104, fl: 184, fws: 560, capb: 900, capg: 400, capl: 800 };
  const r = enlargeLedger(c);
  close(r.area / (c.wx * c.hl), 2, 0.01);
  assert.ok(r.hb >= c.fb && r.hg >= c.fg && r.hl >= c.fl && r.ws >= c.fws);
  close(r.hb + r.hg + r.hl, c.total, 0.5);
  close(r.wx + r.ws, c.W - 20, 0.5);
});

test('enlarging a ledger beside a folded sibling keeps the 56px spine', () => {
  const c = { total: 1000, W: 1800, hb: 400, hg: null, hl: 600, wx: 1724, ws: null, spine: 56, fb: 200, fg: 104, fl: 184, fws: 480, capb: 900, capg: 400, capl: 900 };
  const r = enlargeLedger(c);
  close(r.ws, 56); close(r.wx, 1724);
  assert.ok(r.hl > 600 && r.hb >= 200);
});

test('the largest area the floors leave is taken when twice is out of reach', () => {
  const c = { total: 1000, W: 1800, hb: 400, hg: 200, hl: 400, wx: 880, ws: 900, spine: 56, fb: 380, fg: 190, fl: 184, fws: 880, capb: 900, capg: 400, capl: 800 };
  const r = enlargeLedger(c);
  assert.ok(r.hb >= 380 && r.hg >= 190 && r.ws >= 880);
  assert.ok(r.area < 2 * 880 * 400);
});

test('fold redistributes in proportion and keeps the fractions at one', () => {
  const st = stateFromMeasure({ board: 500, agents: 250, ledgers: 250, pr: 900, is: 900 });
  close(sum1(st.stack), 1, 1e-9);
  const f = foldKey(st, 'board');
  assert.equal(f.stack.board, 0); close(f.stack.agents, 0.5, 1e-9); close(f.stack.ledgers, 0.5, 1e-9);
  const g = foldKey(st, 'is');
  assert.equal(g.row.is, 0); close(g.row.pr, 1, 1e-9);
});

test('folding both ledgers folds the row; unfold returns the base share and the rest shrink in proportion', () => {
  const st = stateFromMeasure({ board: 500, agents: 250, ledgers: 250, pr: 900, is: 900 });
  const both = foldKey(foldKey(st, 'pr'), 'is');
  assert.equal(both.stack.ledgers, 0);
  const back = unfoldKey(both, 'pr');
  close(back.stack.ledgers, 0.25, 1e-9); close(sum1(back.stack), 1, 1e-9);
  assert.equal(back.row.pr, 1);
  const one = unfoldKey(foldKey(st, 'agents'), 'agents');
  close(one.stack.agents, 0.25, 1e-9); close(one.stack.board, 0.5, 1e-9);
});

test('withSizes stores the solved sizes as fractions', () => {
  const st = stateFromMeasure({ board: 500, agents: 250, ledgers: 250, pr: 900, is: 900 });
  const n = withSizes(st, { board: 300, agents: 100, ledgers: 600 }, { pr: 1200, is: 600 });
  close(n.stack.ledgers, 0.6, 1e-9); close(n.row.pr, 2 / 3, 1e-9);
});

test('sanitizeState rejects damage and keeps a valid layout', () => {
  const st = stateFromMeasure({ board: 500, agents: 250, ledgers: 250, pr: 900, is: 900 });
  assert.equal(JSON.stringify(sanitizeState(JSON.stringify(st)).stack), JSON.stringify(st.stack));
  for (const bad of [null, '', '{', '{"v":2}', JSON.stringify({ ...st, v: 2 }), JSON.stringify({ ...st, stack: { board: 'x', ledgers: 1 } }),
    JSON.stringify({ ...st, folded: ['board', 'agents', 'pr', 'is'] }), JSON.stringify({ ...st, folded: ['board', 'pr', 'is'] })]) {
    assert.equal(sanitizeState(bad), null, String(bad));
  }
  assert.equal(JSON.stringify(sanitizeState(JSON.stringify({ ...st, folded: ['board', 'bogus', 'board'] })).folded), '["board"]');
});
