// Browser check for the section resize buttons (docs/design/section-resize.md section 9):
// at 1920x1080 and 1633x930, light and dark, after a sequence of presses the page still fits (no scroll),
// every open section is above its floor, and Reset returns the default measurements exactly.
// It also checks the sticky notes (docs/design/sticky-notes.md, Option 1): create, persist, drag, move, gather, limit,
// EN/TR, light and dark, and that the --demo page never touches the stored notes. Note text here is invented.
// Run: node test/browser.mjs   (needs Playwright's Chromium; it is borrowed from web/node_modules, see package.json "test:browser")
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = createRequire(path.join(root, 'web', 'package.json'))('@playwright/test');
const shotDir = path.join(root, 'test', 'screenshots');
mkdirSync(shotDir, { recursive: true });

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
  s.on('error', reject);
});

const port = await freePort();
const server = spawn(process.execPath, ['server.mjs', '--demo'], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
const browser = await chromium.launch();
let failed = 0;

const sizes = (page) => page.evaluate(() => {
  const r = (s) => { const el = document.querySelector(s); const b = el.getBoundingClientRect(); return { w: b.width, h: b.height, hidden: el.hidden || getComputedStyle(el).display === 'none' }; };
  const d = document.documentElement;
  return {
    board: r('.board'), agents: r('#agents'), row: r('.ledgers'), pr: r('.ledger.pr'), is: r('.ledger.is'),
    scroll: { sh: d.scrollHeight, ih: innerHeight, sw: d.scrollWidth, iw: innerWidth },
    folded: [...document.querySelectorAll('.board.folded, .ledger.folded')].length,
    lf: document.querySelector('.ledgers .l-filters:not([hidden])') ? 34 : 0,
  };
});
const round = (m) => JSON.stringify(m, (k, v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v));

async function fits(page, label) {
  const m = await sizes(page);
  assert.equal(m.scroll.sh, m.scroll.ih, `${label}: scrollHeight`);
  assert.equal(m.scroll.sw, m.scroll.iw, `${label}: scrollWidth`);
  const state = await page.evaluate(() => ({
    folded: ['board', 'agents', 'pr', 'is'].filter((k) => document.querySelector(`[data-rz="${k}"] .rz-fold`).getAttribute('aria-expanded') === 'false'),
    hasEntry: !!document.querySelector('#agList .entry'),
  }));
  const open = (k) => !state.folded.includes(k);
  if (open('board')) assert.ok(m.board.h >= 199.5, `${label}: board floor ${m.board.h}`);
  if (open('agents') && state.hasEntry) assert.ok(m.agents.h >= 103.5, `${label}: agents floor ${m.agents.h}`);
  if (open('pr') || open('is')) assert.ok(m.row.h >= m.lf + 149.5, `${label}: ledger row floor ${m.row.h}`);
  if (open('pr') && open('is')) { assert.ok(m.pr.w >= 559.5, `${label}: pr width ${m.pr.w}`); assert.ok(m.is.w >= 479.5, `${label}: is width ${m.is.w}`); }
  return m;
}
const press = (page, key, act) => page.click(`[data-rz="${key}"] .rz-${act === "enlarge" ? "enl" : act}`);
const area = (s) => s.w * s.h;
const near = (a, b, tol, label) => assert.ok(Math.abs(a - b) <= tol, `${label}: ${a} vs ${b}`);

async function run(width, height, scheme, lang = 'en') {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme });
  const page = await ctx.newPage();
  const tag = `${width}x${height} ${scheme} ${lang}`;
  try {
    await page.goto(`http://localhost:${port}/?lang=${lang}`);
    await page.waitForSelector('.departures tr');
    await page.waitForSelector('#agList .entry');
    await page.waitForSelector('#prList .entry');
    await page.waitForTimeout(300);

    const def = await fits(page, `${tag} default`);
    assert.equal(await page.evaluate(() => document.querySelector('.app').classList.contains('sized')), false, 'no stored layout: the default layout');
    assert.equal(await page.isHidden('#resetLayout'), true, 'Reset shows only once the layout differs');

    // Fold Issues: a 56px spine, the sibling takes the width, board and Agents keep their heights
    await press(page, 'is', 'fold');
    const a = await fits(page, `${tag} fold Issues`);
    near(a.is.w, 56, 0.5, 'Issues spine width');
    near(a.board.h, def.board.h, 3, 'board keeps its height');
    near(a.agents.h, def.agents.h, 3, 'Agents keeps its height');
    assert.equal(await page.getAttribute('[data-rz="is"] .rz-fold', 'aria-expanded'), 'false');
    assert.equal(await page.getAttribute('[data-rz="is"] .rz-fold', 'aria-controls'), 'isList');
    assert.equal(await page.isHidden('#isList'), true, 'a folded body is hidden');

    // Enlarge Pull requests: twice its area, the board and Agents shrink in proportion
    await press(page, 'pr', 'enlarge');
    const b = await fits(page, `${tag} enlarge PR`);
    near(area(b.pr) / area(a.pr), 2, 0.06, 'PR area doubles');
    assert.ok(b.board.h < a.board.h && b.agents.h < a.agents.h, 'the others shrink');
    near(b.board.h / a.board.h, b.agents.h / a.agents.h, 0.05, 'the others shrink in proportion');
    assert.equal(await page.textContent('#rzLive').then((t) => t.trim()), lang === 'tr' ? "Pull request'ler büyütüldü" : 'Pull requests enlarged');
    assert.equal(await page.isVisible('#resetLayout'), true);
    await page.screenshot({ path: path.join(shotDir, `section-resize-${width}x${height}-${scheme}.png`) });

    // A reload keeps the layout
    await page.reload();
    await page.waitForSelector('#prList .entry');
    const r = await fits(page, `${tag} reload`);
    near(r.pr.h, b.pr.h, 2, 'reload keeps the PR height');
    near(r.is.w, 56, 0.5, 'reload keeps the Issues spine');

    // Fold the board and Agents too: the last open section cannot fold
    await press(page, 'board', 'fold');
    await fits(page, `${tag} fold board`);
    near((await sizes(page)).board.h, 50, 6, 'a folded board is a bar');
    await press(page, 'agents', 'fold');
    const c = await fits(page, `${tag} fold Agents`);
    assert.ok(c.agents.h < 70, 'a folded Agents is its head');
    assert.equal(await page.getAttribute('[data-rz="pr"] .rz-fold', 'aria-disabled'), 'true', 'the last open section cannot fold');
    assert.ok((await page.getAttribute('[data-rz="pr"] .rz-fold', 'aria-description')), 'it says why');
    await page.click('[data-rz="pr"] .rz-fold', { force: true }); // ignored
    assert.equal(await page.getAttribute('[data-rz="pr"] .rz-fold', 'aria-expanded'), 'true');

    // Unfold Agents and the board: they return at their default share
    await press(page, 'agents', 'fold');
    await press(page, 'board', 'fold');
    const d = await fits(page, `${tag} unfold`);
    assert.ok(d.board.h > 200 && d.agents.h >= 104, 'sections are back');

    // Enlarge the board, then Agents
    await press(page, 'board', 'enlarge');
    const e = await fits(page, `${tag} enlarge board`);
    assert.ok(e.board.h > d.board.h, 'the board grows');
    await press(page, 'agents', 'enlarge').catch(() => {});
    await fits(page, `${tag} enlarge Agents`);

    // Enlarge Pull requests until the room runs out: it says why and stays focusable
    for (let n = 0; n < 8 && (await page.getAttribute('[data-rz="pr"] .rz-enl', 'aria-disabled')) !== 'true'; n++) {
      await press(page, 'pr', 'enlarge');
      await fits(page, `${tag} enlarge PR #${n}`);
    }
    assert.equal(await page.getAttribute('[data-rz="pr"] .rz-enl', 'aria-disabled'), 'true', 'Enlarge ends');
    assert.ok(await page.getAttribute('[data-rz="pr"] .rz-enl', 'aria-description'));

    // Reset returns the default measurements exactly
    await page.click('#resetLayout');
    const z = await fits(page, `${tag} reset`);
    assert.equal(round(z), round(def), 'Reset returns the default measurements');
    assert.equal(await page.evaluate(() => localStorage.getItem('stampboard-layout')), null);
    assert.equal(await page.isHidden('#resetLayout'), true);
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.className), 'rz-fold', 'focus stays on the page');

    // Fold then unfold from the default returns to the default
    await press(page, 'is', 'fold');
    await press(page, 'is', 'fold');
    const f = await fits(page, `${tag} fold then unfold`);
    near(f.pr.w, def.pr.w, 2, 'PR width');
    near(f.board.h, def.board.h, 3, 'board height');
    near(f.agents.h, def.agents.h, 3, 'Agents height');
    await page.click('#resetLayout');

    if (lang === 'tr') {
      assert.equal(await page.getAttribute('[data-rz="pr"] .rz-fold', 'aria-label'), 'Pull request listesi');
      assert.equal(await page.getAttribute('[data-rz="pr"] .rz-enl', 'aria-label'), "Pull request'leri büyüt");
      assert.equal(await page.getAttribute('[data-rz="board"] .rz-enl', 'aria-label'), 'Actions panosunu büyüt');
    } else {
      assert.equal(await page.getAttribute('[data-rz="pr"] .rz-fold', 'aria-label'), 'Pull request list');
      assert.equal(await page.getAttribute('[data-rz="board"] .rz-enl', 'aria-label'), 'Enlarge the Actions board');
      assert.equal(await page.getAttribute('[data-rz="agents"] .rz-enl', 'aria-description'), 'Shows everything already');
    }

    // The flowing layout (narrow window) with a stored layout: no horizontal scroll, Enlarge hidden, Fold works
    await press(page, 'is', 'fold');
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(100);
    const flow = await sizes(page);
    assert.equal(flow.scroll.sw, flow.scroll.iw, `${tag} flowing: scrollWidth`);
    assert.equal(await page.isVisible('[data-rz="pr"] .rz-enl'), false, 'Enlarge is hidden in the flowing layout');
    await press(page, 'pr', 'fold');
    assert.equal((await sizes(page)).scroll.sw, flow.scroll.iw);
    console.log(`ok   ${tag}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${tag}: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

// ---------- Sticky notes ----------
// The demo server marks its page with data-demo and the page then keeps notes in memory. To test the real storage
// path the page is served without that mark, so no GitHub token or real repository is needed.
async function asOrdinary(ctx) {
  await ctx.route(/\/(index\.html)?(\?.*)?$/, async (route) => {
    if (route.request().resourceType() !== 'document') return route.fallback();
    const res = await route.fetch();
    const html = (await res.text()).replace('<html lang="en" data-demo>', '<html lang="en">');
    await route.fulfill({ response: res, body: html });
  });
}
const seed = (count) => ({
  v: 1,
  notes: Array.from({ length: count }, (_, i) => ({ id: `s${i}`, text: `Sample note ${i}`, x: { e: 'l', o: 48 + (i % 20) * 24 }, y: { e: 't', o: 180 + (i % 10) * 24 }, z: i })),
});
const noteRects = (page) => page.evaluate(() => [...document.querySelectorAll('.note')].map((el) => {
  const b = el.getBoundingClientRect();
  return { id: el.dataset.id, text: el.querySelector('.n-text').value, left: b.left, top: b.top, right: b.right, bottom: b.bottom, w: b.width, h: b.height, z: Number(el.style.zIndex) };
}));
const footH = (page) => page.evaluate(() => document.querySelector('.foot').getBoundingClientRect().height);
async function noFit(page, label) {
  const s = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth }));
  assert.equal(s.sh, s.ih, `${label}: scrollHeight`);
  assert.equal(s.sw, s.iw, `${label}: scrollWidth`);
}
const ready = (page) => page.waitForSelector('#newNote[aria-disabled="false"]');

async function notesRun(width, height, scheme, lang = 'en') {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme });
  await asOrdinary(ctx);
  const page = await ctx.newPage();
  const tag = `notes ${width}x${height} ${scheme} ${lang}`;
  const requests = [];
  page.on('request', (r) => requests.push(r.url() + (r.postData() || '')));
  const logs = [];
  page.on('console', (m) => logs.push(m.text()));
  const T = lang === 'tr'
    ? { newNote: 'Yeni not', gather: 'Notları topla', move: (t) => `Notu taşı: ${t}`, del: (t) => `Notu sil: ${t}`, group: (t) => `Not: ${t}`, deleted: 'Not silindi.', gathered: (n) => `${n} not toplandı.`, region: 'Notlar', placed: 'Not yerleşti.' }
    : { newNote: 'New note', gather: 'Gather notes', move: (t) => `Move note: ${t}`, del: (t) => `Delete note: ${t}`, group: (t) => `Note: ${t}`, deleted: 'Note deleted.', gathered: (n) => `${n} notes gathered.`, region: 'Notes', placed: 'Note placed.' };
  try {
    await page.goto(`http://localhost:${port}/?lang=${lang}`);
    await page.waitForSelector('#prList .entry');
    await ready(page);
    assert.equal(await page.isHidden('#notes'), true, 'no notes: the layer is empty');
    assert.equal(await page.getAttribute('#gatherNotes', 'aria-disabled'), 'true', 'Gather is disabled with no notes');
    assert.equal(await page.getAttribute('#notes', 'aria-label'), T.region);
    assert.equal(await page.textContent('#newNote'), T.newNote);
    assert.equal(await page.textContent('#gatherNotes'), `${T.gather}0`);
    assert.ok((await footH(page)) <= 18, `${tag}: footer one line (${await footH(page)})`);
    await noFit(page, `${tag} empty`);

    // Create, type, persist across a reload; the note opens at the pile spot
    await page.click('#newNote');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'n-text', 'the caret is in the new note');
    await page.keyboard.type('Sample note A');
    let [a] = await noteRects(page);
    near(a.right, width - 24, 0.5, `${tag} new note right`);
    near(a.bottom, height - 44, 0.5, `${tag} new note bottom`);
    near(a.w, 240, 0.5, 'note width'); near(a.h, 216, 0.5, 'note height');
    assert.equal(await page.getAttribute('.note', 'aria-label'), T.group('Sample note A'));
    assert.equal(await page.textContent('.n-title'), 'Sample note A');
    await page.waitForTimeout(600);
    await page.reload();
    await page.waitForSelector('.note');
    [a] = await noteRects(page);
    assert.equal(a.text, 'Sample note A', 'the note survives a reload');
    near(a.right, width - 24, 0.5, `${tag} reload keeps the place`);
    assert.equal(await page.getAttribute('.n-move', 'aria-label'), T.move('Sample note A'));
    assert.equal(await page.getAttribute('.n-del', 'aria-label'), T.del('Sample note A'));
    assert.equal(await page.textContent('#gatherNotes'), `${T.gather}1`);
    assert.ok(!(await page.title()).includes('Sample'), 'the title never carries note text');

    // An empty new note is discarded on Escape and on blur, without a message
    await page.click('#newNote');
    await page.keyboard.press('Escape');
    assert.equal((await noteRects(page)).length, 1, 'Escape discards an empty note');
    assert.equal(await page.isHidden('#nStatus'), true, 'without a message');
    await page.click('#newNote');
    await page.click('#gatherNotes', { force: true });
    await page.waitForTimeout(50);
    assert.equal((await noteRects(page)).length, 1, 'blur discards an empty note');
    await page.evaluate(() => document.activeElement.blur());
    await page.click('#nStatus .n-undo').catch(() => {});

    // Drag by the header: the note follows and snaps to the 24px grid
    const h = await page.locator('.note .n-title').boundingBox();
    await page.mouse.move(h.x + 20, h.y + 10);
    await page.mouse.down();
    await page.mouse.move(h.x - 300, h.y - 200, { steps: 8 });
    await page.mouse.move(h.x - 313, h.y - 217, { steps: 3 });
    assert.equal(await page.evaluate(() => document.querySelector('.note').classList.contains('lifted')), true, 'lifted while dragging');
    await page.mouse.up();
    [a] = await noteRects(page);
    near(a.left % 24, 0, 0.01, 'dragged left on the grid'); near(a.top % 24, 0, 0.01, 'dragged top on the grid');
    assert.ok(a.left < width - 264 - 250 && a.top < height - 260 - 150, 'it moved away from the pile');

    // Move, then click where it goes
    const moveBtn = page.locator('.note .n-move');
    await moveBtn.click();
    assert.equal(await moveBtn.getAttribute('aria-pressed'), 'true');
    assert.ok((await page.textContent('#nStatus')).length > 10, 'the status says where to click');
    await page.mouse.click(500, 400);
    [a] = await noteRects(page);
    assert.deepEqual([a.left, a.top], [504, 408], 'placed by one click, snapped');
    assert.equal(await moveBtn.getAttribute('aria-pressed'), 'false');
    await moveBtn.click();
    await page.keyboard.press('Escape');
    assert.equal(await moveBtn.getAttribute('aria-pressed'), 'false', 'Escape cancels');
    [a] = await noteRects(page);
    assert.deepEqual([a.left, a.top], [504, 408]);

    // Keyboard: arrows move one cell, Shift four
    await moveBtn.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    [a] = await noteRects(page);
    assert.deepEqual([a.left, a.top], [528, 432], 'one cell per arrow');
    await page.keyboard.press('Shift+ArrowLeft');
    [a] = await noteRects(page);
    assert.equal(a.left, 528 - 96, 'Shift moves four cells');
    await page.waitForTimeout(1200);
    assert.equal((await page.textContent('#notesLive')).trim(), T.placed);
    for (let i = 0; i < 20; i++) await page.keyboard.press('Shift+ArrowLeft');
    [a] = await noteRects(page);
    assert.equal(a.left, 8, 'the note cannot leave the viewport');
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForSelector('.note');
    [a] = await noteRects(page);
    assert.equal(a.left, 8, 'a moved note reloads in place');

    // Three more notes, then gather: right 24px, front bottom 44px, 36px steps, z-order kept
    for (const t of ['Sample note B', 'Sample note C', 'Sample note D']) {
      await page.click('#newNote');
      await page.keyboard.type(t);
    }
    await page.evaluate(() => document.activeElement.blur());
    await page.waitForTimeout(600);
    const before = await noteRects(page);
    assert.equal(before.length, 4);
    await noFit(page, `${tag} spread`);
    await page.click('#gatherNotes');
    assert.equal(await page.textContent('#nStatus .n-msg'), T.gathered(4));
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gatherNotes', 'focus stays on Gather');
    const piled = (await noteRects(page)).sort((x, y) => y.z - x.z);
    piled.forEach((r, i) => {
      near(r.right, width - 24, 0.5, `${tag} pile right #${i}`);
      near(r.bottom, height - 44 - i * 36, 0.5, `${tag} pile bottom #${i}`);
    });
    assert.deepEqual(piled.map((r) => r.text), ['Sample note D', 'Sample note C', 'Sample note B', 'Sample note A'], 'the pile keeps the z-order');
    assert.ok((await footH(page)) <= 18, `${tag}: footer one line with a status (${await footH(page)})`);
    await noFit(page, `${tag} gathered`);
    // the controls stay above the pile
    assert.equal(await page.evaluate(() => { const b = document.querySelector('#gatherNotes').getBoundingClientRect(); return document.elementFromPoint(b.left + 4, b.top + 8).closest('#gatherNotes') !== null; }), true);
    // Undo returns every note
    await page.click('#nStatus .n-undo');
    const back = await noteRects(page);
    for (const r of back) { const o = before.find((x) => x.id === r.id); near(r.left, o.left, 0.5, 'undo left'); near(r.top, o.top, 0.5, 'undo top'); }
    await page.click('#gatherNotes');
    await page.waitForTimeout(100);
    await page.reload();
    await page.waitForSelector('.note');
    const afterReload = (await noteRects(page)).sort((x, y) => y.z - x.z);
    near(afterReload[0].right, width - 24, 0.5, 'the pile survives a reload');
    near(afterReload[3].bottom, height - 44 - 3 * 36, 0.5, 'the pile survives a reload');

    // Delete with Undo; the footer stays one line
    await page.locator('.note .n-del').first().focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.textContent('#nStatus .n-msg'), T.deleted);
    assert.equal((await noteRects(page)).length, 3);
    assert.ok((await footH(page)) <= 18, `${tag}: footer one line after delete`);
    await page.click('#nStatus .n-undo');
    assert.equal((await noteRects(page)).length, 4, 'Undo brings the note back');
    assert.equal(await page.isHidden('#nStatus'), true, 'the status clears');

    // Light and dark tokens
    const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.note')).backgroundColor);
    assert.equal(bg, scheme === 'dark' ? 'rgb(57, 51, 34)' : 'rgb(243, 228, 166)', 'the manila surface');

    // Privacy: the text left the page nowhere
    assert.ok(requests.every((u) => !u.includes('Sample note')), 'no request carries note text');
    assert.ok(logs.every((m) => !m.includes('Sample note')), 'no console line carries note text');
    console.log(`ok   ${tag}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${tag}: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

async function notesLimit(width, height) {
  const tag = `notes limit ${width}x${height}`;
  const ctx = await browser.newContext({ viewport: { width, height } });
  await asOrdinary(ctx);
  await ctx.addInitScript((v) => { if (!localStorage.getItem('stampboard-notes')) localStorage.setItem('stampboard-notes', v); }, JSON.stringify(seed(50)));
  const page = await ctx.newPage();
  try {
    await page.goto(`http://localhost:${port}/?lang=en`);
    await page.waitForSelector('.note');
    assert.equal((await noteRects(page)).length, 50);
    assert.equal(await page.getAttribute('#newNote', 'aria-disabled'), 'true', 'New note is disabled at 50');
    assert.equal(await page.getAttribute('#newNote', 'aria-description'), '50 notes is the limit. Delete one to add another.');
    await page.click('#gatherNotes');
    const rs = await noteRects(page);
    for (const r of rs) assert.ok(r.left >= 0 && r.top >= 8 && r.right <= width && r.bottom <= height, `${tag}: every note is inside the viewport`);
    assert.ok(rs.every((r) => r.top >= 148 - 0.5), 'the pile top stays below 148px');
    await noFit(page, tag);
    assert.ok((await footH(page)) <= 18, `${tag}: footer one line`);
    console.log(`ok   ${tag}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${tag}: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

// The --demo page uses an in-memory store: it shows no stored notes and never reads or writes the real key.
async function notesDemo() {
  const ctx = await browser.newContext({ viewport: { width: 1633, height: 930 } });
  await ctx.addInitScript(() => {
    if (!localStorage.getItem('stampboard-notes')) localStorage.setItem('stampboard-notes', JSON.stringify({ v: 1, notes: [{ id: 'seed1', text: 'Sample note A', x: { e: 'l', o: 48 }, y: { e: 't', o: 200 }, z: 0 }] }));
    window.__touched = [];
    for (const m of ['getItem', 'setItem', 'removeItem']) {
      const orig = Storage.prototype[m];
      Storage.prototype[m] = function (k, ...rest) { if (String(k).startsWith('stampboard-notes')) window.__touched.push(`${m}:${k}`); return orig.call(this, k, ...rest); };
    }
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`http://localhost:${port}/?lang=en`);
    await page.waitForSelector('.departures tr');
    await ready(page);
    assert.equal((await noteRects(page)).length, 0, 'the demo shows no stored note');
    await page.click('#newNote');
    await page.keyboard.type('Sample note B');
    await page.waitForTimeout(600);
    await page.click('#gatherNotes');
    assert.equal((await noteRects(page)).length, 1, 'notes still work in memory');
    const touched = await page.evaluate(() => window.__touched);
    assert.deepEqual(touched, [], 'the demo page never reads or writes stampboard-notes');
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('stampboard-notes')));
    assert.equal(stored.notes.length, 1);
    assert.equal(stored.notes[0].text, 'Sample note A', 'the stored notes are untouched');
    console.log('ok   notes demo');
  } catch (err) {
    failed++;
    console.error(`FAIL notes demo: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

// Two tabs on one store (every server start opens a new tab): a tab never writes a stale snapshot over newer notes.
async function notesTwoPages() {
  const ctx = await browser.newContext({ viewport: { width: 1633, height: 930 } });
  await asOrdinary(ctx);
  await ctx.addInitScript((v) => { if (!localStorage.getItem('stampboard-notes')) localStorage.setItem('stampboard-notes', v); }, JSON.stringify(seed(1)));
  const a = await ctx.newPage();
  const b = await ctx.newPage();
  const texts = async (page) => (await noteRects(page)).map((r) => r.text).sort();
  const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('stampboard-notes')).notes.map((n) => n.text).sort());
  try {
    for (const pg of [a, b]) { await pg.goto(`http://localhost:${port}/?lang=en`); await pg.waitForSelector('.departures tr'); await ready(pg); }
    await b.click('#newNote');
    await b.keyboard.type('Sample note B');
    await b.waitForTimeout(600);
    // page A still holds only the seed: touching, editing, moving and gathering must not erase B's note
    await a.click('.note .n-head');
    await a.waitForTimeout(100);
    assert.deepEqual(await stored(a), ['Sample note 0', 'Sample note B'], 'a touch in A keeps the note made in B');
    await a.click('.note .n-text');
    await a.keyboard.type(' edited');
    await a.waitForTimeout(600);
    assert.deepEqual(await stored(a), ['Sample note 0 edited', 'Sample note B'], 'an edit in A keeps the note made in B');
    await a.click('#gatherNotes');
    assert.deepEqual(await stored(a), ['Sample note 0 edited', 'Sample note B'], 'gather in A keeps the note made in B');
    assert.deepEqual(await texts(a), ['Sample note 0 edited', 'Sample note B'], 'A shows the note made in B');
    // a delete in one page does not come back from the other
    const del = a.locator('.note', { has: a.locator('.n-del[aria-label="Delete note: Sample note B"]') }).locator('.n-del');
    if (await del.count()) await del.click();
    await a.waitForTimeout(200);
    await b.waitForTimeout(200);
    assert.deepEqual(await texts(b), ['Sample note 0 edited'], 'the delete in A reaches B');
    await b.click('.note .n-head');
    await b.waitForTimeout(100);
    assert.deepEqual(await stored(b), ['Sample note 0 edited'], 'B does not bring the deleted note back');
    assert.deepEqual(await texts(a), ['Sample note 0 edited'], 'A does not get it back either');
    console.log('ok   notes two pages');
  } catch (err) {
    failed++;
    console.error(`FAIL notes two pages: ${err.message}`);
  } finally {
    await ctx.close();
  }
}

try {
  for (let n = 0; n < 50; n++) {
    try { if ((await fetch(`http://localhost:${port}/`)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  for (const [w, h] of [[1920, 1080], [1633, 930]]) for (const scheme of ['light', 'dark']) await run(w, h, scheme);
  await run(1633, 930, 'light', 'tr');
  for (const [w, h] of [[1920, 1080], [1633, 930]]) for (const scheme of ['light', 'dark']) await notesRun(w, h, scheme);
  await notesRun(1633, 930, 'light', 'tr');
  await notesLimit(1920, 1080);
  await notesLimit(1633, 930);
  await notesDemo();
  await notesTwoPages();
} finally {
  await browser.close();
  server.kill();
}
if (failed) { console.error(`${failed} browser check(s) failed`); process.exit(1); }
console.log('browser checks passed');
