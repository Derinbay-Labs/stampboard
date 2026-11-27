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
  // the layout box: a rotated note's bounding box is bigger, so positions are read from the unrotated box
  const left = el.offsetLeft, top = el.offsetTop;
  return { id: el.dataset.id, text: el.querySelector('.n-text').value, left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight, w: el.offsetWidth, h: el.offsetHeight, z: Number(el.style.zIndex), angle: parseFloat(el.style.getPropertyValue('--a')) };
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
    ? { newNote: 'Yeni not', gather: 'Notları topla', hint: 'Alt+ok tuşları taşır · Shift daha uzağa', moveItem: 'Taşı', menu: (t) => `Not seçenekleri: ${t}`, group: (t) => `Not: ${t}`, deleted: 'Not silindi.', gathered: (n) => `${n} not toplandı.`, region: 'Notlar', placed: 'Not yerleşti.' }
    : { newNote: 'New note', gather: 'Gather notes', hint: 'Alt+arrow keys move · Shift moves farther', moveItem: 'Move', menu: (t) => `Note options: ${t}`, group: (t) => `Note: ${t}`, deleted: 'Note deleted.', gathered: (n) => `${n} notes gathered.`, region: 'Notes', placed: 'Note placed.' };
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
    await page.waitForTimeout(600);
    await page.reload();
    await page.waitForSelector('.note');
    [a] = await noteRects(page);
    assert.equal(a.text, 'Sample note A', 'the note survives a reload');
    near(a.right, width - 24, 0.5, `${tag} reload keeps the place`);
    assert.equal(await page.locator('.note button').count(), 0, 'no button inside a note (#83)');
    assert.equal(await page.evaluate(() => { const t = document.querySelector('.note .n-text'); return document.getElementById(t.getAttribute('aria-describedby')).textContent; }), T.hint, 'the move hint is the textarea description');
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
    await page.waitForTimeout(700); // any smooth move ends
    const h = await page.locator('.note .n-head').boundingBox();
    await page.mouse.move(h.x + h.width / 2, h.y + 10);
    await page.mouse.down();
    await page.mouse.move(h.x - 300, h.y - 200, { steps: 8 });
    await page.mouse.move(h.x - 313, h.y - 217, { steps: 3 });
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.note')).transform.startsWith('matrix(')), true);
    assert.equal(await page.evaluate(() => document.querySelector('.note').classList.contains('lifted')), true, 'lifted while dragging');
    await page.mouse.up();
    [a] = await noteRects(page);
    near(a.left % 24, 0, 0.01, 'dragged left on the grid'); near(a.top % 24, 0, 0.01, 'dragged top on the grid');
    assert.ok(a.left < width - 264 - 250 && a.top < height - 260 - 150, 'it moved away from the pile');

    // Move from the note menu, then click where it goes
    const ta0 = page.locator('.note .n-text');
    await page.click('.note .n-head', { button: 'right' });
    assert.equal(await page.locator('.n-menu [data-act="move"]').textContent(), T.moveItem);
    await page.click('.n-menu [data-act="move"]');
    assert.equal(await page.evaluate(() => document.body.classList.contains('placing')), true);
    assert.ok((await page.textContent('#nStatus')).length > 10, 'the status says where to click');
    await page.mouse.click(500, 400);
    [a] = await noteRects(page);
    assert.deepEqual([a.left, a.top], [504, 408], 'placed by one click, snapped');
    assert.equal(await page.evaluate(() => document.body.classList.contains('placing')), false);
    await page.click('.note .n-head', { button: 'right' });
    await page.click('.n-menu [data-act="move"]');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.body.classList.contains('placing')), false, 'Escape cancels');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('n-text')), true, 'Escape focuses the note text');
    [a] = await noteRects(page);
    assert.deepEqual([a.left, a.top], [504, 408]);

    // Keyboard: Alt+arrows move one cell, Alt+Shift four; plain arrows only move the caret
    await ta0.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    [a] = await noteRects(page);
    assert.deepEqual([a.left, a.top], [504, 408], 'plain arrows do not move the note');
    await page.keyboard.press('Alt+ArrowRight');
    await page.keyboard.press('Alt+ArrowDown');
    [a] = await noteRects(page);
    assert.deepEqual([a.left, a.top], [528, 432], 'one cell per Alt+arrow');
    await page.keyboard.press('Alt+Shift+ArrowLeft');
    [a] = await noteRects(page);
    assert.equal(a.left, 528 - 96, 'Shift moves four cells');
    await page.waitForTimeout(1200);
    assert.equal((await page.textContent('#notesLive')).trim(), T.placed);
    for (let i = 0; i < 20; i++) await page.keyboard.press('Alt+Shift+ArrowLeft');
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
    await page.waitForTimeout(700); // the smooth move ends
    assert.equal(await page.textContent('#nStatus .n-msg'), T.gathered(4));
    assert.equal(await page.evaluate(() => document.activeElement.id), 'gatherNotes', 'focus stays on Gather');
    const piled = (await noteRects(page)).sort((x, y) => y.z - x.z);
    piled.forEach((r, i) => {
      assert.ok(Math.abs(r.right - (width - 24)) <= 18.5 && Math.abs(r.bottom - (height - 44)) <= 18.5, `${tag} pile #${i} is within 18px of the corner slot`);
      assert.ok(Math.abs(r.right - (width - 24)) >= 7.5 && Math.abs(r.bottom - (height - 44)) >= 7.5, `${tag} pile #${i} is off by at least 8px: not a tidy stack`);
      assert.ok(Math.abs(r.angle) <= 8, `${tag} pile angle #${i}`);
    });
    assert.ok(new Set(piled.map((r) => `${r.left},${r.top},${r.angle}`)).size === 4, `every note lies differently ${JSON.stringify(piled.map((r) => [r.left, r.top, r.angle]))}`);
    assert.deepEqual(piled.map((r) => r.text), ['Sample note D', 'Sample note C', 'Sample note B', 'Sample note A'], 'the pile keeps the z-order');
    assert.ok((await footH(page)) <= 18, `${tag}: footer one line with a status (${await footH(page)})`);
    await noFit(page, `${tag} gathered`);
    // the controls stay above the pile
    assert.equal(await page.evaluate(() => { const b = document.querySelector('#gatherNotes').getBoundingClientRect(); return document.elementFromPoint(b.left + 4, b.top + 8).closest('#gatherNotes') !== null; }), true);
    // Undo returns every note
    await page.click('#nStatus .n-undo');
    await page.waitForTimeout(700); // the smooth move ends
    const back = await noteRects(page);
    for (const r of back) { const o = before.find((x) => x.id === r.id); near(r.left, o.left, 0.5, 'undo left'); near(r.top, o.top, 0.5, 'undo top'); }
    await page.click('#gatherNotes'); // gather once more, then compare the exact positions and angles after a reload
    await page.waitForTimeout(700);
    const messy = (await noteRects(page)).sort((x, y) => y.z - x.z);
    await page.reload();
    await page.waitForSelector('.note');
    const afterReload = (await noteRects(page)).sort((x, y) => y.z - x.z);
    assert.deepEqual(afterReload.map((r) => [r.text, r.left, r.top, r.angle]), messy.map((r) => [r.text, r.left, r.top, r.angle]), 'the messy pile survives a reload exactly: positions and angles');

    // Delete with Undo; the footer stays one line
    await page.locator('.note .n-text').first().focus();
    await page.keyboard.press('Shift+F10');
    await page.click('.n-menu [data-act="delete"]');
    assert.equal(await page.textContent('#nStatus .n-msg'), T.deleted);
    assert.equal((await noteRects(page)).length, 3);
    assert.ok((await footH(page)) <= 18, `${tag}: footer one line after delete`);
    await page.click('#nStatus .n-undo');
    assert.equal((await noteRects(page)).length, 4, 'Undo brings the note back');
    assert.equal(await page.isHidden('#nStatus'), true, 'the status clears');

    // Light and dark tokens
    const bg = await page.evaluate(() => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = getComputedStyle(document.querySelector('.n-paper')).backgroundColor; c.fillRect(0, 0, 1, 1); const d = c.getImageData(0, 0, 1, 1).data; return (d[0] + d[1] + d[2]) / 3; });
    assert.ok(scheme === 'dark' ? bg < 90 : bg > 200, `the paper is ${scheme} (${bg})`);

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

// The realism pass (#81): storage migration, the right-click menu (mouse and keyboard), every menu action, bullets,
// the paper never overflowing, the messy pile and pass-through clicks. Note text here is invented.
async function notesRealism(scheme = 'light', reduced = false) {
  const width = 1633, height = 930;
  const tag = `notes realism ${scheme}${reduced ? ' reduced-motion' : ''}`;
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: scheme, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await asOrdinary(ctx);
  const legacy = { v: 1, notes: [
    { id: 'm1', text: 'Sample legacy title\nsecond line', x: { e: 'l', o: 120 }, y: { e: 't', o: 200 }, z: 0 },
    { id: 'm2', text: 'Sample corner note', x: { e: 'r', o: 24 }, y: { e: 'b', o: 44 }, z: 1 },
    { id: 'm3', text: 'Sample third note', x: { e: 'l', o: 480 }, y: { e: 't', o: 200 }, z: 2 },
  ] };
  await ctx.addInitScript((v) => { if (!localStorage.getItem('stampboard-notes')) localStorage.setItem('stampboard-notes', v); }, JSON.stringify(legacy));
  const page = await ctx.newPage();
  const requests = [], logs = [];
  page.on('request', (r) => requests.push(r.url() + (r.postData() || '')));
  page.on('console', (m) => logs.push(m.text()));
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('stampboard-notes')));
  const rec = async (id) => (await stored()).notes.find((n) => n.id === id);
  const note = (id) => page.locator(`.note[data-id="${id}"]`);
  const inNote = (id) => page.evaluate((i) => !!document.activeElement.closest(`.note[data-id="${i}"]`), id);
  const menuOpen = () => page.locator('.n-menu').count();
  const rightClick = (id, x = 60, y = 120) => note(id).click({ button: 'right', position: { x, y } });
  try {
    await page.goto(`http://localhost:${port}/?lang=en`);
    await page.waitForSelector('.note');
    await ready(page);

    // Migration: a v1 note loads with its text and position; its first line is the title; the next save is v2 with defaults
    let rs = await noteRects(page);
    const m1 = rs.find((r) => r.id === 'm1');
    assert.equal(m1.text, 'Sample legacy title\nsecond line');
    assert.deepEqual([m1.left, m1.top], [120, 200]);
    assert.equal(await note('m1').getAttribute('aria-label'), 'Note: Sample legacy title');
    assert.equal((await stored()).v, 1, 'opening does not rewrite what is stored');
    await note('m1').locator('.n-head').click({ position: { x: 100, y: 10 } });
    let s = await stored();
    assert.equal(s.v, 2);
    assert.deepEqual([s.notes[0].font, s.notes[0].size, s.notes[0].color, s.notes[0].pinned, s.notes[0].angle], ['sans', 14, 'yellow', false, 0]);
    assert.equal(s.notes[0].text, 'Sample legacy title\nsecond line');

    // The paper: no ruled lines, the grain layer and the curl shadows exist, text is drawn without a scrollbar
    const look = await page.evaluate(() => {
      const el = document.querySelector('.note[data-id="m1"]'), ta = el.querySelector('.n-text');
      return { img: getComputedStyle(ta).backgroundImage, curl: getComputedStyle(el, '::before').boxShadow, grain: getComputedStyle(el.querySelector('.n-paper'), '::after').backgroundImage, sb: getComputedStyle(ta).scrollbarWidth, top: getComputedStyle(el).boxShadow };
    });
    assert.equal(look.img, 'none', 'no ruled lines');
    assert.ok(look.curl !== 'none' && look.grain.includes('feTurbulence'), 'curl shadow and noise grain');
    assert.equal(look.sb, 'none');

    // Right-click opens the note's own menu, kept inside the screen edges
    await rightClick('m2', 230, 200);
    assert.equal(await menuOpen(), 1);
    let box = await page.locator('.n-menu').boundingBox();
    assert.ok(box.x >= 8 && box.y >= 8 && box.x + box.width <= width - 8 && box.y + box.height <= height - 8, 'the menu stays inside the screen');
    assert.equal(await page.locator('.n-menu [data-act="color"]').count(), 5);
    assert.deepEqual(await page.locator('.n-menu [data-act="color"]').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label'))), ['Classic Yellow', 'Pastel Pink', 'Mint Green', 'Light Blue', 'Orange']);
    assert.equal(await page.locator('.n-menu [data-act="font"]').count(), 5);
    await page.keyboard.press('Escape');
    assert.equal(await menuOpen(), 0);
    assert.equal(await inNote('m2'), true, 'focus returns to the note when the menu closes');

    // Colour
    await rightClick('m1');
    await page.click('.n-menu [data-act="color"][data-v="pink"]');
    assert.equal(await menuOpen(), 0);
    assert.equal(await note('m1').getAttribute('data-c'), 'pink');
    assert.equal((await rec('m1')).color, 'pink');
    assert.equal(await inNote('m1'), true);
    const lum = (c) => page.evaluate((id) => { const x = document.createElement('canvas').getContext('2d'); x.fillStyle = getComputedStyle(document.querySelector(`.note[data-id="${id}"] .n-paper`)).backgroundColor; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; }, c);
    assert.notDeepEqual(await lum('m1'), await lum('m2'), 'pink differs from yellow');
    // Font
    await rightClick('m1');
    await page.click('.n-menu [data-act="font"][data-v="kalam"]');
    assert.equal(await note('m1').getAttribute('data-f'), 'kalam');
    assert.ok((await note('m1').evaluate((el) => getComputedStyle(el.querySelector('.n-text')).fontFamily)).includes('Kalam'));
    assert.equal((await rec('m1')).font, 'kalam');
    // Size: A+ and A- stay open, so they can be clicked repeatedly
    await rightClick('m1');
    await page.click('.n-menu [data-act="up"]');
    await page.click('.n-menu [data-act="up"]');
    assert.equal(await menuOpen(), 1, 'the menu stays open while resizing');
    assert.equal((await rec('m1')).size, 18);
    await page.click('.n-menu [data-act="down"]');
    assert.equal((await rec('m1')).size, 16);
    // Tilt
    await page.click('.n-menu [data-act="random"]');
    const a1 = (await rec('m1')).angle;
    assert.ok(a1 >= -4 && a1 <= 4);
    assert.equal(await menuOpen(), 1);
    await page.click('.n-menu [data-act="reset"]');
    assert.equal((await rec('m1')).angle, 0);
    assert.equal(await note('m1').evaluate((el) => el.style.getPropertyValue('--a')), '0deg');
    // Pin to front: the dog-ear shows and the note stays on top
    await page.click('.n-menu [data-act="pin"]');
    assert.equal(await menuOpen(), 0);
    assert.equal((await rec('m1')).pinned, true);
    assert.equal(await note('m1').locator('.n-ear').isVisible(), true, 'the dog-ear shows');
    await note('m3').locator('.n-head').click({ position: { x: 100, y: 10 } }); // the other notes come to the front, the pinned one stays above
    rs = await noteRects(page);
    assert.ok(rs.find((r) => r.id === 'm1').z > rs.find((r) => r.id === 'm3').z, 'a pinned note stays above');
    // everything survives a reload
    await page.reload();
    await page.waitForSelector('.note');
    const back = await rec('m1');
    assert.deepEqual([back.font, back.size, back.color, back.pinned, back.angle], ['kalam', 16, 'pink', true, 0]);
    assert.equal(await note('m1').getAttribute('data-c'), 'pink');
    assert.equal(await note('m1').locator('.n-ear').isVisible(), true);

    // Pass-through: empty parts of the notes layer, and the cut corner of a pinned note, never block the board
    const hit = (x, y) => page.evaluate(([px, py]) => { const e = document.elementFromPoint(px, py); return e ? !!e.closest('.notes') : null; }, [x, y]);
    assert.equal(await hit(900, 500), false, 'an empty spot reaches the board');
    assert.equal(await hit(120 + 120, 200 + 100), true, 'a note is hit');

    // Keyboard path: Shift+F10 and the context-menu key; arrows move; Escape closes and focus returns
    await note('m3').locator('.n-text').focus();
    await page.keyboard.press('Shift+F10');
    assert.equal(await menuOpen(), 1);
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('.n-menu')), true, 'focus moves into the menu');
    const f1 = await page.evaluate(() => document.activeElement.getAttribute('aria-label') || document.activeElement.textContent);
    await page.keyboard.press('ArrowRight');
    const f2 = await page.evaluate(() => document.activeElement.getAttribute('aria-label') || document.activeElement.textContent);
    assert.notEqual(f1, f2, 'arrow keys move through the menu');
    await page.keyboard.press('Enter'); // picks a colour; the menu closes and focus returns to the note
    assert.equal(await menuOpen(), 0);
    assert.equal(await inNote('m3'), true, 'focus returns to the note after a choice');
    await page.keyboard.press('ContextMenu');
    assert.equal(await menuOpen(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await inNote('m3'), true);
    await note('m3').locator('.n-text').focus();
    await page.keyboard.press('Shift+F10');
    assert.equal(await menuOpen(), 1, 'Shift+F10 opens the menu from the textarea');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('n-text')), true, 'focus returns to the textarea');
    assert.equal(await page.locator('.note button').count(), 0, 'no button inside any note, in any colour or state (#83)');

    // Delete from the menu, then Undo brings the note back with its look
    await rightClick('m1');
    await page.click('.n-menu [data-act="delete"]');
    assert.equal((await noteRects(page)).length, 2);
    await page.click('#nStatus .n-undo');
    assert.equal((await noteRects(page)).length, 3);
    const undone = await rec('m1');
    assert.deepEqual([undone.font, undone.color, undone.pinned], ['kalam', 'pink', true]);

    // Writing: one text area, title emphasis after Enter, bullets, strike, the paper never overflows
    await page.click('#newNote');
    await page.keyboard.type('Sample title');
    assert.equal(await page.locator('.note:has(.n-text:focus) .n-view .ti').count(), 0, 'no title emphasis before Enter');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.note:has(.n-text:focus) .n-view .ti').count(), 1, 'the first line reads as a title after Enter');
    await page.keyboard.type('- one');
    await page.keyboard.press('Enter');
    await page.keyboard.type('two');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // an empty bullet ends the list
    const fresh = page.locator('.note:has(.n-text:focus)');
    assert.equal(await fresh.locator('.n-text').inputValue(), 'Sample title\n• one\n• two\n');
    assert.equal(await fresh.locator('.n-view .mk').count(), 2);
    assert.equal(await fresh.locator('.n-text').evaluate((t) => t.scrollHeight <= t.clientHeight + 1), true, 'no scrollbar needed');
    const mk = await fresh.locator('.n-view .mk').first().boundingBox();
    await page.mouse.click(mk.x + 3, mk.y + mk.height / 2); // a click on the bullet strikes it like a pencil
    assert.equal((await fresh.locator('.n-text').inputValue()).split('\n')[1], '✓ one');
    assert.equal(await fresh.locator('.n-view .sx').count(), 1);
    assert.equal(await fresh.locator('.n-view .sx').evaluate((e) => getComputedStyle(e).textDecorationLine), 'line-through');
    const id = await fresh.getAttribute('data-id');
    await page.waitForTimeout(600);
    assert.ok((await rec(id)).text.includes('✓ one'), 'the struck bullet is saved');
    await page.reload();
    await page.waitForSelector('.note');
    assert.equal(await note(id).locator('.n-view .sx').count(), 1, 'the struck bullet survives a reload');
    const mk2 = await note(id).locator('.n-view .mk').first().boundingBox();
    await page.mouse.click(mk2.x + 3, mk2.y + mk2.height / 2); // clicking again clears it
    assert.equal(await note(id).locator('.n-view .sx').count(), 0);
    // a long text steps the font down, and input that cannot fit is refused
    const ta = note(id).locator('.n-text');
    await ta.fill('Sample words '.repeat(14));
    const fit1 = await note(id).evaluate((el) => ({ fits: el.querySelector('.n-text').scrollHeight <= el.querySelector('.n-text').clientHeight + 1, fs: parseFloat(el.style.getPropertyValue('--fs')) }));
    assert.equal(fit1.fits, true, 'the text stays on the paper');
    assert.ok(fit1.fs < 16, 'the font stepped down');
    await ta.fill('x'.repeat(3000));
    const fit2 = await note(id).evaluate((el) => ({ fits: el.querySelector('.n-text').scrollHeight <= el.querySelector('.n-text').clientHeight + 1, len: el.querySelector('.n-text').value.length }));
    assert.equal(fit2.fits, true);
    assert.ok(fit2.len < 3000, 'input that cannot fit is limited');
    await ta.fill('Sample short');

    // Drag by the head: it grows and deepens its shadow while held, then settles at a new tilt close to the old one
    await note('m3').locator('.n-head').scrollIntoViewIfNeeded();
    const was = (await rec('m3')).angle;
    const hb = await note('m3').locator('.n-head').boundingBox();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + 12);
    await page.mouse.down();
    await page.mouse.move(hb.x + 200, hb.y + 100, { steps: 6 });
    await page.waitForTimeout(300); // the lift transition ends
    const held = await note('m3').evaluate((el) => getComputedStyle(el).transform);
    assert.ok(/matrix\(/.test(held));
    const sc = await note('m3').evaluate((el) => { const m = new DOMMatrix(getComputedStyle(el).transform); return Math.hypot(m.a, m.b); });
    assert.ok(Math.abs(sc - 1.03) < 0.005, `scale(1.03) while held (${sc})`);
    await page.mouse.up();
    const now = (await rec('m3')).angle;
    assert.ok(now >= -4 && now <= 4 && Math.abs(now - Math.min(Math.max(was, -4), 4)) <= 1.5 + 1e-6, `settled near ${was}: ${now}`);

    // Gather: a messy pile; positions and angles persist; a click pulls a note out of it
    await page.click('#gatherNotes');
    await page.waitForTimeout(700);
    const pile = (await noteRects(page)).sort((x, y) => y.z - x.z);
    for (const r of pile) {
      assert.ok(Math.abs(r.right - (width - 24)) <= 18.5 && Math.abs(r.bottom - (height - 44)) <= 18.5, 'near the corner');
      assert.ok(Math.abs(r.angle) <= 8);
    }
    s = await stored();
    for (const r of pile) { const o = s.notes.find((n) => n.id === r.id); assert.equal(o.angle, r.angle, 'the pile angle is saved'); }
    // the lowest note is pulled out by dragging its visible edge
    const low = pile[pile.length - 1];
    const spot = await page.evaluate((id) => {
      const el = document.querySelector(`.note[data-id="${id}"]`), r = el.getBoundingClientRect();
      for (let y = r.top + 2; y < r.bottom; y += 3) for (let x = r.left + 2; x < r.right; x += 3) { const e = document.elementFromPoint(x, y); if (e && e.closest('.note') === el) return { x, y }; }
      return null;
    }, low.id);
    assert.ok(spot, 'part of the lowest note shows');
    await page.mouse.move(spot.x, spot.y);
    await page.mouse.down();
    await page.mouse.move(spot.x - 250, spot.y - 220, { steps: 6 });
    await page.mouse.up();
    const after = (await noteRects(page)).sort((x, y) => y.z - x.z);
    assert.equal(after.find((r) => r.id !== 'm1').id, low.id, 'the pulled note is at the front (a pinned note stays above)');
    assert.ok(Math.abs(after.find((r) => r.id === low.id).right - (width - 24)) > 100, 'it left the pile');
    assert.equal(await note(low.id).evaluate((el) => el.classList.contains('piled')), false);
    if (reduced) assert.equal(await note(pile[0].id).evaluate((el) => getComputedStyle(el).transitionDuration), '0s', 'no motion with prefers-reduced-motion');

    assert.ok(requests.every((u) => !u.includes('Sample')), 'no request carries note text');
    assert.ok(logs.every((m) => !m.includes('Sample')), 'no console line carries note text');
    console.log(`ok   ${tag}`);
  } catch (err) {
    failed++;
    console.error(`FAIL ${tag}: ${err.message}`);
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
    const bn = a.locator('.note[aria-label="Note: Sample note B"]');
    assert.equal(await bn.count(), 1, 'A shows the note made in B');
    await bn.locator('.n-text').focus(); // the gathered pile hides it under another note: the keyboard path reaches it
    await a.keyboard.press('Shift+F10');
    await a.click('.n-menu [data-act="delete"]');
    await a.waitForTimeout(200);
    await b.waitForTimeout(200);
    assert.deepEqual(await texts(b), ['Sample note 0 edited'], 'the delete in A reaches B');
    await b.click('.note .n-head');
    await b.waitForTimeout(100);
    assert.deepEqual(await stored(b), ['Sample note 0 edited'], 'B does not bring the deleted note back');
    assert.deepEqual(await texts(a), ['Sample note 0 edited'], 'A does not get it back either');
    // Undo in A after B saw the delete: B adopts the restored note and its next write keeps it
    await a.click('#nStatus .n-undo');
    await a.waitForTimeout(200);
    assert.deepEqual(await texts(b), ['Sample note 0 edited', 'Sample note B'], 'B shows the note A restored');
    await b.click('.note[aria-label="Note: Sample note B"] .n-head');
    await b.waitForTimeout(100);
    assert.deepEqual(await stored(b), ['Sample note 0 edited', 'Sample note B'], 'a touch in B keeps the note A restored');
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
  await notesRealism('light');
  await notesRealism('dark');
  await notesRealism('light', true);
  await notesDemo();
  await notesTwoPages();
} finally {
  await browser.close();
  server.kill();
}
if (failed) { console.error(`${failed} browser check(s) failed`); process.exit(1); }
console.log('browser checks passed');
