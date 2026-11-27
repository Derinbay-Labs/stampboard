// Browser check for the section resize buttons (docs/design/section-resize.md section 9):
// at 1920x1080 and 1633x930, light and dark, after a sequence of presses the page still fits (no scroll),
// every open section is above its floor, and Reset returns the default measurements exactly.
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

try {
  for (let n = 0; n < 50; n++) {
    try { if ((await fetch(`http://localhost:${port}/`)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  for (const [w, h] of [[1920, 1080], [1633, 930]]) for (const scheme of ['light', 'dark']) await run(w, h, scheme);
  await run(1633, 930, 'light', 'tr');
} finally {
  await browser.close();
  server.kill();
}
if (failed) { console.error(`${failed} browser check(s) failed`); process.exit(1); }
console.log('browser checks passed');
