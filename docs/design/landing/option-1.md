# Option 1: Monitor on the Sweep

Landing page for `stampboard.derinbay.com`, design sub-issue #16 of #15. Mockup:
[mockups/option-1.html](mockups/option-1.html) (`?lang=en|tr`, `?theme=auto|light|dark`).

The page takes the family base, Studio Sweep, nearly as it is. It stays in the blue family and
puts the real Stampboard page on a desktop monitor that stands on the sweep. The product's own
world (ink, warm grid paper, vermilion seal, yellow lamp) lives only inside the monitor screen.

## 1. User goal

A developer who runs GitHub Actions on several repositories, often with Claude Code sessions on
more than one machine, wants to know in under a minute what Stampboard shows, that it is local and
read-only, and how to start it. Success means copying the install command or opening the GitHub
repository.

## 2. Entry points

- `stampboard.derinbay.com/en/` and `/tr/` from the Labs page (`derinbay.com/<locale>/labs/`), the
  GitHub README and search.
- Deep links to `#board`, `#install` and `#trust` from the nav and the README.
- No web app, so there is no login button. The hero CTA is the install command plus GitHub.

## 3. Flow

1. The visitor reads the H1 and the lead, then sees the monitor.
2. Optionally they switch scenes (Busy morning, Quiet evening, Agents on three machines) or press
   a note to light up one part of the board.
3. They read the spec plate, the three close-ups and the trust ledger.
4. They copy the install command (hero, steps or the final CTA) or open GitHub.

## 4. Options

This is one of three options; the comparison and the recommendation are in [README.md](README.md).

## 5. Layout and screen states

Section order, as the base: nav; hero (headline 6/12, lead and install 6/12); stage (wall to floor
sweep, scene tabs, monitor, three notes); spec plate overlapping the stage by 44 px; close-ups (one
wide plinth with the seal, two stacked: runner plates, sessions across machines); steps; trust
ledger; final CTA with a monitor peek; footer with the large Labs nameplate.

| State | Behaviour |
|---|---|
| Default | Busy morning scene: 3 running, 3 queued, 6 pull requests, 5 issues, 3 sessions. |
| Empty | The Quiet evening scene shows the product's own quiet state: no running jobs, one queued, a short ledger and no agents sheet (the product hides it). |
| Loading | Static page; nothing loads after first paint. Fonts are self-hosted and use `font-display: swap`; the system fallback keeps the layout. |
| Error | The only runtime action is copy. When the clipboard API is missing or refuses, the command text is selected and `#live` announces "Select the command to copy it" / "Kopyalamak için komutu seçin". |
| Partial data | The Agents scene shows an unreachable host (`nas`) in the sheet head, as the product does. |
| Offline | The page is fully static and works offline once loaded; there are no network requests after the HTML. |
| No JavaScript | Production renders the default scene and the EN or TR copy at build time; the mockup needs JavaScript only for its review toggles. |

## 6. Components and tokens

Reuses the base: `--lab-*`, `.btn`, `.seg`, `.cmd`, scene tabs, notes, spec plate, plinths, steps,
trust ledger, footer and Labs nameplate. New: the monitor bezel and stand (a frame around the
product, not a new control).

| Token | Light | Dark |
|---|---|---|
| `--ground` | `#F4F6F9` | `#0D1117` |
| `--wall` | `#D9E1EC` | `#172131` |
| `--floor` | `#ECF0F5` | `#111925` |
| `--surface` | `#FFFFFF` | `#151C27` |
| `--surface-2` | `#EEF2F7` | `#1C2531` |
| `--ink` | `#111A27` | `#E7ECF3` |
| `--mut` | `#4A5567` | `#A2ADBD` |
| `--line` | `#CAD3DF` | `#2B3544` |
| `--accent` | `#1E4E8C` | `#94B8E8` |
| `--accent-ink` | `#FFFFFF` | `#0B1626` |
| `--focus` | `#1E4E8C` | `#94B8E8` |
| `--cmd-bg` | `#111A27` | `#1C2531` |

Inside the monitor the product's own tokens from `DESIGN.md` apply unchanged, scoped under `.sb`.

Type: Funnel Display (headings), Funnel Sans (text), JetBrains Mono for figures and code (Funnel
Sans has no tabular figures). The product UI keeps Archivo and JetBrains Mono.

### Measured contrast

| Foreground | Background | Ratio | Need |
|---|---|---|---|
| ink `#111A27` | ground `#F4F6F9` | 16.15 | 4.5 |
| mut `#4A5567` | ground `#F4F6F9` | 6.96 | 4.5 |
| mut `#4A5567` | wall `#D9E1EC` | 5.72 | 4.5 |
| mut `#4A5567` | surface `#FFFFFF` | 7.54 | 4.5 |
| accent-ink `#FFFFFF` | accent `#1E4E8C` | 8.32 | 4.5 |
| focus `#1E4E8C` | wall `#D9E1EC` | 6.31 | 3 |
| cmd ink `#E7ECF3` | cmd-bg `#111A27` | 14.73 | 4.5 |
| cmd focus `#94B8E8` | cmd-bg `#111A27` | 8.56 | 3 |
| ink `#E7ECF3` | ground `#0D1117` | 15.94 | 4.5 |
| mut `#A2ADBD` | wall `#172131` | 7.12 | 4.5 |
| mut `#A2ADBD` | surface `#151C27` | 7.54 | 4.5 |
| accent-ink `#0B1626` | accent `#94B8E8` | 8.89 | 4.5 |
| focus `#94B8E8` | wall `#172131` | 7.92 | 3 |
| cmd ink `#E7ECF3` | cmd-bg `#1C2531` | 13.02 | 4.5 |

`--line` (`#CAD3DF`, 1.40:1) is decorative: no control is identified by its border alone; every
bordered control also has a text label.

## 7. Copy

| Key | EN | TR |
|---|---|---|
| H1 | Your GitHub day, on one screen. | GitHub gününüz, tek ekranda. |
| Lead | A live page for a spare monitor: running and queued Actions jobs, every open pull request and issue across your accounts, and the Claude Code sessions on your machines. A stamp marks what needs you. | Boştaki monitör için canlı bir sayfa: çalışan ve sıradaki Actions job'ları, tüm hesaplarınızdaki açık pull request ve issue'lar, makinelerinizdeki Claude Code oturumları. Size düşen işin üstünde bir mühür olur. |
| Install note | Needs Node.js 26 and a signed-in gh. To try it without a GitHub account, run `npm run demo` instead. | Node.js 26 ve oturum açılmış gh gerekir. GitHub hesabı olmadan denemek için `npm run demo` çalıştırın. |
| Scenes | Busy morning / Quiet evening / Agents on three machines | Yoğun sabah / Sakin akşam / Üç makinede ajanlar |
| Close-ups | Read the room in a glance. | Durumu tek bakışta okuyun. |
| Steps | Running in a minute. | Bir dakikada çalışır. |
| Trust | Local, read-only, yours. | Yerel, salt okunur, sizin. |
| Final | Put your GitHub day on the spare monitor. | GitHub gününüzü boştaki monitöre taşıyın. |

Steps, trust rows and footer copy are shared by all three options; the full strings are in the
mockup's `COMMON` object. All claims are from the repository README (127.0.0.1 only, Host-header
check, token kept server-side, read-only, no third parties, strict CSP, session files only).

## 8. Accessibility acceptance criteria

- Focus order: skip link, logo, nav (The board, Install, Security), TR/EN, GitHub, hero Copy, scene
  tablist (one tab stop; Arrow keys, Home and End move), the screen tabpanel (`tabindex="0"`), the
  three notes, final Copy, final GitHub, footer links, Labs nameplate.
- Every control is at least 44 by 44 px; the copy and primary buttons are 48 px tall.
- Scene tabs: `role="tablist"`, `aria-selected`, `aria-controls`; the panel is labelled by the
  selected tab.
- Notes are toggle buttons with `aria-pressed`; lighting a part never hides content from assistive
  technology.
- Copy announces "Copied" through a polite live region; failure selects the text and says so.
- The product figure is real, readable HTML (tables, lists, headings), and the tabpanel is named by
  its scene tab; lamps and seals carry `role="img"` with a
  label, so status is never colour alone (the product's own rule: lamp plus label, seal plus word).
- Running timers update every second inside `aria-hidden` clocks; the board summary text carries
  the counts.
- `prefers-reduced-motion: reduce` stops the stamp animation, smooth scrolling and transitions.
- No page-level horizontal scroll at 360 px (measured); the product reflows by container queries
  and its departures table scrolls inside itself.
- Language: `<html lang>` follows the toggle; TR/EN buttons carry `lang`.

## 9. Platform notes

- Web only, built per the `landing-page` skill: static, TR/EN routes, `hreflang` pairs, the Labs
  footer nameplate linking `https://derinbay.com/<locale>/labs/`.
- Fonts self-hosted as WOFF2 (the mockup inlines them as `data:` URIs so the file opens offline).
- No analytics, no third-party scripts. The product figure is static HTML in production: the
  sample-data renderer may run at build time; live timers are the only runtime script besides copy.
- The monitor is presentation. Under 860 px the bezel thins and the screen takes the full width.

## 10. Open questions

- Shared questions are in [README.md](README.md#open-questions).
- The monitor at phone width shows the product at about 40 % scale; the close-ups carry the
  detail there.

### Trade-offs

- Closest to the family, lowest risk, easiest to build from the base.
- Stampboard's own character is confined to the screen, so the page reads like a sibling of every
  other Labs landing rather than like Stampboard.
