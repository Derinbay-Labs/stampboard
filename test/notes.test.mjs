// Unit tests for the sticky note maths in index.html (the block between the <notes-math> markers) and the
// privacy rules that can be checked without a browser. Test text is invented ("Sample note A"), never real.
// Run: node --test test/*.test.mjs
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const m = html.match(/\/\/ <notes-math>\n([\s\S]*?)\/\/ <\/notes-math>/);
assert.ok(m, 'notes-math markers present in index.html');
const names = 'NOTE snapGrid clampPos anchorOf resolvePos pileCapacity pileSlot noteTitle sanitizeNotes';
const { NOTE, snapGrid, clampPos, anchorOf, resolvePos, pileCapacity, pileSlot, noteTitle, sanitizeNotes } = vm.runInNewContext(`${m[1]}\n({ ${names.split(' ').join(', ')} })`);
const plain = (v) => JSON.parse(JSON.stringify(v));

test('snapGrid rounds to the 24px paper grid', () => {
  assert.equal(snapGrid(11), 0);
  assert.equal(snapGrid(13), 24);
  assert.equal(snapGrid(100), 96);
});

test('clampPos keeps the whole note inside with an 8px margin, also in a window smaller than a note', () => {
  assert.deepEqual(plain(clampPos(-50, -50, 1633, 930)), { left: 8, top: 8 });
  assert.deepEqual(plain(clampPos(5000, 5000, 1633, 930)), { left: 1633 - 240 - 8, top: 930 - 216 - 8 });
  assert.deepEqual(plain(clampPos(300, 300, 200, 200)), { left: 8, top: 8 });
});

test('anchorOf stores the nearest corner and resolvePos restores it, also after a resize', () => {
  const a = anchorOf(1300, 700, 1633, 930);
  assert.deepEqual(plain(a), { x: { e: 'r', o: 93 }, y: { e: 'b', o: 14 } });
  assert.deepEqual(plain(resolvePos(a.x, a.y, 1633, 930)), { left: 1300, top: 700 });
  // a narrower window keeps the note near the right edge
  assert.deepEqual(plain(resolvePos(a.x, a.y, 1280, 760)), { left: 1280 - 240 - 93, top: 760 - 216 - 14 });
  const b = anchorOf(40, 60, 1633, 930);
  assert.deepEqual(plain(b), { x: { e: 'l', o: 40 }, y: { e: 't', o: 60 } });
  // clamping never changes the stored offset: the note returns when the window grows again
  assert.deepEqual(plain(resolvePos({ e: 'r', o: 5 }, { e: 'b', o: 5 }, 1633, 930)), { left: 1633 - 240 - 8, top: 930 - 216 - 8 });
});

test('the pile: right 24px, front bottom 44px, 36px steps, columns of 252px', () => {
  assert.deepEqual(plain(pileSlot(0, 1633, 930)), { left: 1633 - 24 - 240, top: 930 - 44 - 216 });
  assert.deepEqual(plain(pileSlot(1, 1633, 930)), { left: 1633 - 24 - 240, top: 930 - 44 - 216 - 36 });
  assert.equal(pileCapacity(1080), 19);
  assert.equal(pileCapacity(930), 15);
  const next = pileSlot(15, 1633, 930);
  assert.equal(next.left, 1633 - 24 - 240 - 252);
  assert.equal(next.top, 930 - 44 - 216);
  assert.ok(pileSlot(14, 1633, 930).top >= NOTE.pileTop, 'the pile top never goes above 148px');
  // 50 notes take 3 columns at 1080px and 4 at 930px
  assert.equal(Math.ceil(50 / pileCapacity(1080)), 3);
  assert.equal(Math.ceil(50 / pileCapacity(930)), 4);
});

test('noteTitle is the first non-empty line', () => {
  assert.equal(noteTitle(''), '');
  assert.equal(noteTitle('\n  Sample note A  \nline two'), 'Sample note A');
});

test('sanitizeNotes keeps good records, clamps text, keeps unreadable ones unchanged and flags a foreign value', () => {
  assert.deepEqual(plain(sanitizeNotes(null)), { notes: [], rest: [], bad: false });
  assert.equal(sanitizeNotes('not json').bad, true);
  assert.equal(sanitizeNotes('{"v":2,"notes":[]}').bad, true);
  const good = { id: 'a1', text: 'Sample note A', x: { e: 'r', o: 24 }, y: { e: 'b', o: 44 }, z: 3 };
  const odd = { id: 'a2', text: 5 };
  const s = sanitizeNotes(JSON.stringify({ v: 1, notes: [good, odd, null, { ...good }, { id: 'a3', text: 'x'.repeat(5000), x: 'bad', y: null }] }));
  assert.equal(s.notes.length, 2);
  assert.deepEqual(plain(s.notes[0]), good);
  assert.equal(s.notes[1].text.length, 4000);
  assert.deepEqual(plain(s.notes[1].x), { e: 'r', o: 24 }, 'an invalid position falls back to the pile spot');
  assert.deepEqual(plain(s.rest), [odd, null, good]);
  const many = { v: 1, notes: Array.from({ length: 60 }, (_, i) => ({ id: `n${i}`, text: `Sample note ${i}`, x: { e: 'l', o: 0 }, y: { e: 't', o: 0 }, z: i })) };
  const lim = sanitizeNotes(JSON.stringify(many));
  assert.equal(lim.notes.length, 50);
  assert.equal(lim.rest.length, 10);
});

test('a local notes file would never reach git', () => {
  const ignored = execFileSync('git', ['check-ignore', '-v', 'notes.json'], { cwd: root, encoding: 'utf8' });
  assert.match(ignored, /\.gitignore/);
  assert.match(readFileSync(path.join(root, '.gitignore'), 'utf8'), /^notes\.json$/m);
});

test('note text is never logged, sent or shown outside the note', () => {
  const script = html.slice(html.indexOf('// ---------- Sticky notes (docs/design'));
  assert.ok(!/console\./.test(script), 'no console call near the notes code');
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(script.slice(0, script.indexOf('function initNotes') + 400)), 'the notes code sends nothing');
  assert.ok(!/document\.title\s*=[^;]*\.text/.test(script), 'the title never carries note text');
});
