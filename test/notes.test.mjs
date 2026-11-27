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
const names = 'NOTE COLORS FONTS SIZES DEFAULTS FRESH TILT snapGrid clampPos anchorOf resolvePos pileCapacity pileSlot noteTitle sanitizeNotes randomTilt settleAngle stepSize messyPile menuPos lineKind toggleStrike';
const { NOTE, COLORS, FONTS, SIZES, DEFAULTS, FRESH, TILT, snapGrid, clampPos, anchorOf, resolvePos, pileCapacity, pileSlot, noteTitle, sanitizeNotes, randomTilt, settleAngle, stepSize, messyPile, menuPos, lineKind, toggleStrike } = vm.runInNewContext(`${m[1]}\n({ ${names.split(' ').join(', ')} })`);
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
  assert.equal(sanitizeNotes('{"v":3,"notes":[]}').bad, true);
  assert.equal(sanitizeNotes('{"v":2,"notes":[]}').bad, false);
  const good = { id: 'a1', text: 'Sample note A', x: { e: 'r', o: 24 }, y: { e: 'b', o: 44 }, z: 3 };
  const odd = { id: 'a2', text: 5 };
  const s = sanitizeNotes(JSON.stringify({ v: 1, notes: [good, odd, null, { ...good }, { id: 'a3', text: 'x'.repeat(5000), x: 'bad', y: null }] }));
  assert.equal(s.notes.length, 2);
  assert.deepEqual(plain(s.notes[0]), { ...good, ...DEFAULTS }, 'a v1 note loads with its text and position and the default look');
  assert.equal(s.notes[1].text.length, 4000);
  assert.deepEqual(plain(s.notes[1].x), { e: 'r', o: 24 }, 'an invalid position falls back to the pile spot');
  assert.deepEqual(plain(s.rest), [odd, null, good]);
  const many = { v: 1, notes: Array.from({ length: 60 }, (_, i) => ({ id: `n${i}`, text: `Sample note ${i}`, x: { e: 'l', o: 0 }, y: { e: 't', o: 0 }, z: i })) };
  const lim = sanitizeNotes(JSON.stringify(many));
  assert.equal(lim.notes.length, 50);
  assert.equal(lim.rest.length, 10);
});

const v2 = { id: 'b1', text: 'Sample title\n\u2022 one\n\u2713 two', x: { e: 'l', o: 40 }, y: { e: 't', o: 60 }, z: 7, angle: -2.5, font: 'kalam', size: 20, color: 'mint', pinned: true };

test('v1 to v2: the title is the first line of the unchanged text, new fields take their defaults, the next save is v2', () => {
  const v1 = { id: 'a1', text: 'Sample note A\nline two', x: { e: 'r', o: 24 }, y: { e: 'b', o: 44 }, z: 3 };
  const s = sanitizeNotes(JSON.stringify({ v: 1, notes: [v1] }));
  assert.equal(s.notes[0].text, v1.text);
  assert.equal(noteTitle(s.notes[0].text), 'Sample note A');
  assert.deepEqual(plain(s.notes[0]), { ...v1, angle: 0, font: 'sans', size: 14, color: 'yellow', pinned: false });
  const again = sanitizeNotes(JSON.stringify({ v: 2, notes: s.notes }));
  assert.deepEqual(plain(again.notes), plain(s.notes), 'a v2 save of a migrated note reads back the same');
});

test('every new field round-trips through v2', () => {
  const s = sanitizeNotes(JSON.stringify({ v: 2, notes: [v2] }));
  assert.deepEqual(plain(s.notes), [v2]);
  for (const color of COLORS) for (const font of FONTS) assert.deepEqual(plain(sanitizeNotes(JSON.stringify({ v: 2, notes: [{ ...v2, color, font }] })).notes[0]), { ...v2, color, font });
  for (const size of SIZES) assert.equal(sanitizeNotes(JSON.stringify({ v: 2, notes: [{ ...v2, size }] })).notes[0].size, size);
  assert.equal(sanitizeNotes(JSON.stringify({ v: 2, notes: [{ ...v2, pinned: false }] })).notes[0].pinned, false);
  assert.equal(sanitizeNotes(JSON.stringify({ v: 2, notes: [{ ...v2, angle: 7.6 }] })).notes[0].angle, 7.6, 'a Gather tilt up to 8 degrees is kept');
});

test('a missing or invalid new field takes its default; the record is still read', () => {
  for (const bad of [{ font: 'comic' }, { font: 3 }, { size: 15 }, { size: '16' }, { size: null }, { color: 'red' }, { color: 1 }, { pinned: 'yes' }, { pinned: 1 }, { angle: 'x' }, { angle: null }]) {
    const n = sanitizeNotes(JSON.stringify({ v: 2, notes: [{ ...v2, ...bad }] })).notes[0];
    const key = Object.keys(bad)[0];
    assert.deepEqual(n[key], DEFAULTS[key], `invalid ${key} falls back`);
    assert.equal(n.text, v2.text);
    assert.deepEqual(plain(n.x), v2.x);
  }
  assert.equal(sanitizeNotes(JSON.stringify({ v: 2, notes: [{ ...v2, angle: 99 }] })).notes[0].angle, TILT.stored, 'an angle is clamped to 8 degrees');
  const { font, size, color, pinned, angle, ...old } = v2;
  assert.deepEqual(plain(sanitizeNotes(JSON.stringify({ v: 2, notes: [old] })).notes[0]), { ...old, ...DEFAULTS });
});

test('unreadable records stay preserved in rest for v2 as for v1', () => {
  const odd = { id: 'z', text: 9 };
  const s = sanitizeNotes(JSON.stringify({ v: 2, notes: [v2, odd, 7] }));
  assert.equal(s.notes.length, 1);
  assert.deepEqual(plain(s.rest), [odd, 7]);
});

test('tilt: new notes -4..4, a dropped note stays within 1.5 degrees of its angle and within -4..4', () => {
  assert.equal(randomTilt(0), -4); assert.equal(randomTilt(0.5), 0); assert.ok(randomTilt(0.999999) <= 4);
  for (const cur of [-8, -4, -2, 0, 3.9, 4, 8]) for (const r of [0, 0.25, 0.5, 0.75, 0.999]) {
    const a = settleAngle(cur, r), c = Math.min(Math.max(cur, -4), 4);
    assert.ok(a >= -4 && a <= 4 && Math.abs(a - c) <= 1.5 + 1e-9, `${cur} ${r} -> ${a}`);
  }
});

test('A+ and A- step through the size list and stop at its ends', () => {
  assert.equal(stepSize(16, 1), 18); assert.equal(stepSize(16, -1), 14);
  assert.equal(stepSize(SIZES[0], -1), null); assert.equal(stepSize(SIZES[SIZES.length - 1], 1), null);
  assert.equal(stepSize(FRESH.size, 1) > FRESH.size, true);
});

test('the messy pile: each note 8..18px off the pile spot in X and Y, tilted -8..8, inside the window', () => {
  const base = pileSlot(0, 1633, 930);
  const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
  const lo = messyPile(1, 1633, 930, seq(0, 0, 0, 0, 0))[0];
  assert.deepEqual(plain(lo), { left: base.left - 8, top: base.top - 8, angle: -8 });
  const far = messyPile(1, 1633, 930, seq(0, 0.9999, 0, 0.9999, 0.5))[0];
  assert.equal(far.left, base.left - 18); assert.equal(far.top, base.top - 18); assert.equal(far.angle, 0);
  const hi = messyPile(1, 1633, 930, seq(0.9, 0, 0.9, 0, 0.9999))[0];
  assert.equal(hi.left, base.left + 8); assert.equal(hi.top, base.top + 8); assert.ok(hi.angle > 7.9);
  let k = 7;
  const rnd = () => { k = (k * 16807) % 2147483647; return k / 2147483647; };
  const pile = messyPile(50, 1633, 930, rnd);
  assert.equal(pile.length, 50);
  for (const p of pile) {
    assert.ok(Math.abs(p.left - base.left) >= 7.5 && Math.abs(p.left - base.left) <= 18.5, 'X offset');
    assert.ok(Math.abs(p.top - base.top) >= 7.5 && Math.abs(p.top - base.top) <= 18.5, 'Y offset');
    assert.ok(Math.abs(p.angle) <= 8);
    assert.deepEqual(plain(clampPos(p.left, p.top, 1633, 930)), { left: p.left, top: p.top });
  }
  assert.ok(new Set(pile.map((p) => `${p.left},${p.top}`)).size > 10, 'not one tidy stack');
});

test('the menu opens at the pointer and stays 8px inside the screen edges', () => {
  assert.deepEqual(plain(menuPos(100, 120, 232, 380, 1633, 930)), { left: 100, top: 120 });
  assert.deepEqual(plain(menuPos(1600, 900, 232, 380, 1633, 930)), { left: 1633 - 232 - 8, top: 930 - 380 - 8 });
  assert.deepEqual(plain(menuPos(-5, -5, 232, 380, 1633, 930)), { left: 8, top: 8 });
});

test('bullets: a struck line is a bullet with the tick mark, and striking twice restores it', () => {
  assert.equal(lineKind('\u2022 one'), 'open'); assert.equal(lineKind('- one'), 'open'); assert.equal(lineKind('* one'), 'open');
  assert.equal(lineKind('\u2713 one'), 'done'); assert.equal(lineKind('one'), null); assert.equal(lineKind('-one'), null);
  assert.equal(toggleStrike('\u2022 one'), '\u2713 one');
  assert.equal(toggleStrike('\u2713 one'), '\u2022 one');
  assert.equal(toggleStrike('- one'), '\u2713 one', 'a v1 dash line can be struck too');
  assert.equal(toggleStrike('plain'), 'plain');
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
