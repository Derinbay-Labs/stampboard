// Renders the Open Graph images web/public/og/{en,tr}.png (1200x630) from the product page
// running on demo data (`server.mjs --demo`), never a signed-in account: a live render would
// publish real repository, branch and author names. Run from web/: `node scripts/render-og.mjs`.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const WEB = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(WEB, "..");
const OUT = join(WEB, "public", "og");
const PORT = Number(process.env.OG_PORT ?? 4791);
const MAX_BYTES = 150 * 1024;
const VIEW = { width: 1600, height: 840 };

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
    await page.goto(`http://127.0.0.1:${PORT}/?lang=${lang}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
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
