# Option 3: Departure Hall

Landing page for `stampboard.derinbay.com`, design sub-issue #16 of #15. Mockup:
[mockups/option-3.html](mockups/option-3.html) (`?lang=en|tr`, `?theme=auto|light|dark`).

The hero is the departure board itself: a full-bleed board-black hall, dark in both themes, with
the H1 where the board's headline sits and a live clock with a yellow seconds lamp. The install is
three departures. Under the hero, the real board runs at page scale with working runner and
repository filters. Below the hall the page turns to paper in light mode and stays board-black in
dark mode.

## Why it leaves the family blue

The departure board is Stampboard's signature: `DESIGN.md` names it "the hero" of the product, a
black board under a yellow lamp. Making the landing hero that board says what the product is
before any copy is read. Blue would compete with the one colour that means "running" (the lamp
`#FFCF33`). The family tie stays through type, the section order, the shared trust ledger and the
large Labs nameplate, which keeps its own `--lab-*` colours in the footer.

Yellow is used only as the lamp: running state, the clock's seconds, the focus ring in the hall and
the dark-mode primary fill. It never carries text colour on a light ground. Vermilion appears only
inside product sheets, where it keeps its "needs you" meaning.

## 1. User goal

As Option 1, plus: let the visitor operate the board for a moment (filter it) before installing.

## 2. Entry points

As Option 1. No login button.

## 3. Flow

1. Hall: H1, clock, lead; the install as three departures (clone, start, open `localhost:4747`)
   with what happens at each; then the Copy block and the install note.
2. Live board: filter chips work; the board narrows; a polite announcement says how many jobs are
   shown.
3. "Yellow means running. Red means you.": the lamp and stamp legend beside the pull-request
   ledger, then agents across three machines with an unreachable host.
4. Spec line, steps, trust ledger, final board-black band with a small board, footer.

## 4. Options

One of three; see [README.md](README.md).

## 5. Screen states

| State | Behaviour |
|---|---|
| Default | All jobs; no filter pressed. |
| Empty | Filtering to a combination with no jobs shows the product's empty copy, "The board is empty. Jobs appear here when a workflow starts.", in the board, and the announcement says "0 jobs shown". |
| Loading | Static; fonts swap. |
| Error | Copy failure selects the command and announces it. |
| Partial data | Agents sheet head shows `nas` unreachable. |
| Offline | Fully static; works offline once loaded. |
| No JavaScript | Production renders the unfiltered board at build time and shows the chips as static labels. |

## 6. Components and tokens

Reuses the base `.btn`, `.seg`, `.cmd`, steps, trust ledger, footer and Labs plate, and the
product's board, chips, ledger and agents sheet. New patterns:

- The install departures table: the product's departures row (lamp, number, command, gate, time)
  used for instructions. It is a real `<table>` with a caption, because the content is tabular.
- Interactive filter chips on a marketing page: the product's own chips with `aria-pressed`, grown
  to 44 px for the page.

| Token | Light | Dark |
|---|---|---|
| `--hall` (hero, final band) | `#141310` | `#0D0C0B` |
| `--hall-ink` | `#F4F1EA` | `#ECE6D8` |
| `--hall-mut` | `#A8A196` | `#A49D8F` |
| `--hall-rule` | `#34312B` | `#2E2B26` |
| `--lamp` | `#FFCF33` | `#FFCF33` |
| `--lamp-ink` | `#141310` | `#141310` |
| `--ground` (below hall) | `#F4F1EA` | `#0D0C0B` |
| `--surface` | `#FBF9F4` | `#181714` |
| `--ink` | `#22201C` | `#ECE6D8` |
| `--mut` | `#685F52` | `#A49D8F` |
| `--accent` | `#22201C` | `#FFCF33` |
| `--accent-ink` | `#FBF9F4` | `#141310` |
| `--focus` | `#2F4A7A` (paper), lamp in the hall | `#FFCF33` |

### Measured contrast

| Foreground | Background | Ratio | Need |
|---|---|---|---|
| hall ink `#F4F1EA` | hall `#141310` | 16.47 | 4.5 |
| hall mut `#A8A196` | hall `#141310` | 7.26 | 4.5 |
| lamp `#FFCF33` (focus, UI) | hall `#141310` | 12.58 | 3 |
| lamp-ink `#141310` | lamp `#FFCF33` | 12.58 | 4.5 |
| hall mut `#A49D8F` | hall dark `#0D0C0B` | 7.26 | 4.5 |
| ink `#22201C` | paper `#F4F1EA` | 14.42 | 4.5 |
| mut `#685F52` | paper `#F4F1EA` | 5.56 | 4.5 |
| focus `#2F4A7A` | paper `#F4F1EA` | 7.82 | 3 |
| ink `#ECE6D8` | ground dark `#0D0C0B` | 15.71 | 4.5 |
| mut `#A49D8F` | surface dark `#181714` | 6.66 | 4.5 |
| accent-ink `#141310` | accent `#FFCF33` | 12.58 | 4.5 |
| focus `#FFCF33` | ground dark `#0D0C0B` | 13.24 | 3 |

The yellow legend key on paper is 1.31:1 by fill, so it carries a 1.5 px ink outline (14.42:1)
and a text label.

## 7. Copy

| Key | EN | TR |
|---|---|---|
| H1 | A departure board for your GitHub day. | GitHub gününüz için bir kalkış tabelası. |
| Lead | Running and queued Actions jobs, every open pull request and issue, and the Claude Code sessions on your machines, on one page for a spare monitor. It runs on your computer and only reads. | Çalışan ve sıradaki Actions job'ları, açık her pull request ve issue, makinelerinizdeki Claude Code oturumları; boştaki monitör için tek sayfada. Bilgisayarınızda çalışır ve yalnızca okur. |
| Departures (what happens) | One server file, one page file / Needs Node.js 26 and a signed-in gh / Leave it open on the spare monitor | Bir sunucu dosyası, bir sayfa dosyası / Node.js 26 ve oturum açılmış gh gerekir / Boştaki monitörde açık bırakın |
| Board caption | Try it. Pick a runner or a repository to filter the board, as you would on the monitor. | Deneyin. Tabelayı süzmek için bir runner ya da repo seçin; monitörde de böyle çalışır. |
| Announcement | `n` jobs shown | `n` job gösteriliyor |
| Section | Yellow means running. Red means you. | Sarı çalışıyor demek. Kırmızı siz demek. |
| Final | Give the spare monitor a job. | Boştaki monitöre bir iş verin. |

The departures have no time column: there is no measured install time to show.

## 8. Accessibility acceptance criteria

- Focus order: skip link, logo, nav, TR/EN, GitHub, hero Copy, filter chips (runner, then
  repository; each a toggle button), final Copy, footer links, Labs nameplate.
- Filter chips are 44 px tall with `aria-pressed`; after a press focus stays on the same chip
  (the board re-renders and focus is restored) and `#live` announces the shown count. Verified by
  script: build-box gives 1 row, "1 job shown"; adding repo web gives the empty copy, "0 jobs
  shown", focus on the web chip, all 7 chips still present.
- Lamps in the install table are `role="img"` labelled "Now" and "Next"; the board's own lamps say
  "Running" and "Queued".
- The final small board is `aria-hidden` (it repeats the live board).
- Focus ring is the lamp yellow inside the hall and the final band, ink blue on paper.
- Under 860 px the "What happens" column hides; the command always wraps rather than scrolling
  the page.
- Reduced motion: no transitions; the clock still ticks (it is content, not decoration).

## 9. Platform notes

As Option 1. The filter script is about 20 lines on top of the build-time board render. The
hero is dark in light mode too, so the light theme starts dark and turns light at the first
section; `color-scheme` is set per theme for form controls.

## 10. Open questions

- Shared questions in [README.md](README.md#open-questions).
- An interactive board on the landing commits the build to shipping the product renderer (or a
  snapshot of it) as page script; Options 1 and 2 can ship static HTML only.

### Trade-offs

- Strongest first impression and the only option where the visitor operates the product.
- Dark hero in light mode is a deliberate break from the base's light sweep.
- Most build effort: interactive chips, live announcement and a renderer on the page.
