// Renders the Open Graph images web/public/og/{en,tr}.png (1200x630) from the product page
// running on demo data (`server.mjs --demo`), never a signed-in account: a live render would
// publish real repository, branch and author names. Run from web/: `node scripts/render-og.mjs`.
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { en } from "../src/content/en.ts";
import { tr } from "../src/content/tr.ts";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(WEB, "..");
const OUT = join(WEB, "public", "og");
const PORT = Number(process.env.OG_PORT ?? 4791);
const MAX_BYTES = 150 * 1024;
const VIEW = { width: 1600, height: 840 };
const COPY = { en, tr };

// The overlay uses the landing's own face (Funnel Display 700) and tokens (--cmd-bg, --cmd-ink,
// --cmd-focus and the logo's stamp red). Sizes are CSS px at VIEW scale: 40 px is 30 px
// in the 1200 px frame and 64 px is 48 px, both over the 28 px floor of docs/seo/landing.md
// section 6. The card sits inside the 1080 x 510 safe area (80 px margin at VIEW scale).
// The demo page's CSP only allows same-origin fonts, so the faces are served from /__og/ by a route.
const font = (file) => `/__og/${file}`;
const FONT_CSS = ["latin", "latin-ext"]
  .map(
    (subset) => `@font-face{font-family:"OG Funnel Display";font-weight:300 800;
src:url(${font(`funnel-display-${subset}-wght-normal.woff2`)}) format("woff2");
unicode-range:${subset === "latin" ? "U+0000-00FF,U+0131,U+2000-206F" : "U+011E-011F,U+0130,U+015E-015F"};}`,
  )
  .join(" ");

function overlay(headline) {
  return `
<style>${FONT_CSS}
#og-card{position:fixed;left:100px;bottom:100px;width:960px;box-sizing:border-box;padding:32px 40px 36px;
background:#111a27;color:#e7ecf3;border-radius:14px;border-left:8px solid #94b8e8;
box-shadow:0 24px 60px -24px rgb(17 26 39 / .55);font-family:"OG Funnel Display",system-ui,sans-serif;z-index:99999}
#og-card .m{display:flex;align-items:center;gap:14px;font-weight:700;font-size:40px;line-height:1;letter-spacing:-.01em}
#og-card .m svg{width:44px;height:44px}
#og-card h1{margin:22px 0 0;font-weight:700;font-size:64px;line-height:1.05;letter-spacing:-.035em;color:#fff;text-wrap:balance}
</style>
<div id="og-card"><div class="m"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="6" fill="#141310"/><rect x="6" y="9" width="20" height="4" fill="#f4f1ea"/><rect x="6" y="15" width="13" height="4" fill="#f4f1ea"/><rect x="21" y="17" width="7" height="7" fill="#c23523" transform="rotate(-8 24.5 20.5)"/></svg><span>Stampboard</span></div><h1>${headline}</h1></div>`;
}

function startDemo() {
  // A throwaway state dir keeps the demo away from a running instance's state files.
  const state = mkdtempSync(join(tmpdir(), "stampboard-og-"));
  const child = spawn(process.execPath, ["server.mjs", "--demo"], {
    cwd: REPO,
    env: {
      ...process.env,
      PORT: String(PORT),
      LOCALAPPDATA: state,
      XDG_STATE_HOME: state,
      XDG_CONFIG_HOME: state,
      APPDATA: state,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const ready = new Promise((ok, fail) => {
    let out = "";
    const timer = setTimeout(() => fail(new Error(`demo server not ready:\n${out}`)), 15_000);
    const onData = (d) => {
      out += d;
      // Only the demo instance prints this; anything else (a live server, a port clash) fails.
      if (out.includes(`127.0.0.1:${PORT}`) || out.includes(`localhost:${PORT}`)) {
        if (!out.includes("(demo data)")) fail(new Error(`not the demo instance:\n${out}`));
        clearTimeout(timer);
        ok();
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", (code) => fail(new Error(`demo server exited ${code}:\n${out}`)));
  });
  return { child, state, ready };
}

const demo = startDemo();
let browser;
try {
  await demo.ready;
  browser = await chromium.launch();
  for (const lang of ["en", "tr"]) {
    const page = await browser.newPage({
      // A wider layout scaled to 1200x630 so the pull request and issue ledgers show below the
      // Actions board, as the alt text says.
      viewport: { width: VIEW.width, height: VIEW.height },
      deviceScaleFactor: 1200 / VIEW.width,
      colorScheme: "light",
      locale: lang === "tr" ? "tr-TR" : "en-US",
    });
    await page.route("**/__og/*", (route) =>
      route.fulfill({
        body: readFileSync(
          join(WEB, "public", "fonts", basename(new URL(route.request().url()).pathname)),
        ),
        contentType: "font/woff2",
      }),
    );
    await page.goto(`http://127.0.0.1:${PORT}/?lang=${lang}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      (html) => document.body.insertAdjacentHTML("beforeend", html),
      overlay(COPY[lang].h1),
    );
    await page.evaluate(() => document.fonts.load('700 64px "OG Funnel Display"', "ğşİıÇ"));
    await page.waitForTimeout(500);
    const file = join(OUT, `${lang}.png`);
    await page.screenshot({ path: file, type: "png" });
    const size = statSync(file).size;
    console.log(`${file}: ${size} bytes`);
    if (size > MAX_BYTES) throw new Error(`${file} is ${size} bytes, over ${MAX_BYTES}`);
    await page.close();
  }
} finally {
  await browser?.close();
  demo.child.kill();
  try {
    rmSync(demo.state, { recursive: true, force: true });
  } catch {
    /* the OS temp cleaner takes it */
  }
}
