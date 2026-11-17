# Stampboard landing: three designs on Studio Sweep

Design sub-issue #16 of #15, for `stampboard.derinbay.com`. **Awaiting the CEO's pick**
(constitution §2); nothing is built before it. Recommended default: **Option 1**, see below.

Each option takes the Labs landing base, Studio Sweep (company
`docs/design/labs-landing-base/option-2.md`), plus `labs-identity.md`, and customises it for
Stampboard. Option 1 stays in the family blue; Options 2 and 3 leave it for Stampboard's own world
and state why.

## What every option shares

- Type: Funnel Display for headings, Funnel Sans for text, JetBrains Mono for figures and code
  (Funnel Sans has no tabular numerals). The product UI keeps its own Archivo and JetBrains Mono.
- The base section order: hero, stage with the real product, proof figures, close-ups, three
  install steps, trust ledger, final CTA, footer.
- Hero CTA is the copyable install command plus a GitHub link. There is no web app, so no login
  button.
- The trust ledger replaces the base's testimonial; every row is a fact from the repository
  README's Security section. There are no invented quotes or numbers.
- The Labs nameplate appears only in the footer, large, linking `https://derinbay.com/<locale>/labs/`
  with `hreflang` (company#539). It keeps its `--lab-*` colours on every option.
- The stage shows the real Stampboard UI: a port of `index.html` scoped under `.sb`, rendered from
  `demo.mjs`'s made-up organisation `acme` and labelled as sample data. Its viewport breakpoints
  became container queries, so it reflows the way the real page does at that width.
- EN/TR toggle in the nav and an Auto/Light/Dark toggle in a review-only shell bar.
  `?lang=tr&theme=dark` exist for review.
- Every control at least 44 px; copy and primary buttons 48 px. Copy announces through a polite
  live region and selects the text on failure.
- No third-party fonts, scripts or analytics. The mockups inline the self-hosted fonts as `data:`
  URIs so each file opens offline; production serves the same WOFF2 files from the site.

## Comparison

| | [Option 1: Monitor on the Sweep](option-1.md) | [Option 2: Ledger Page](option-2.md) | [Option 3: Departure Hall](option-3.md) |
|---|---|---|---|
| Idea | The base as it is: the product on a desktop monitor standing on the sweep | The page is a ledger sheet in the product's own paper world; the install entry is stamped "Your move" | The hero is the departure board; the real board below it filters live |
| Palette | Blue slate, accent `#1E4E8C` / `#94B8E8` | Product paper and ink, seal `#C23523` / `#EC6450` | Board black and lamp `#FFCF33`; paper below in light |
| Leaves blue | No | Yes: the product pins its palette in `DESIGN.md` | Yes: the board is the product's hero; blue would fight the lamp |
| Stage | Scene tabs: busy morning, quiet evening, agents on three machines | Index tabs: Actions, pull requests, issues, agents, each at real size | One live board with working runner and repository filters |
| Message | "Your GitHub day, on one screen." | "Everything open. Stamped where it needs you." | "A departure board for your GitHub day." |
| Build effort | Lowest: base components plus a bezel | Medium: binder tabs, grid ground | Highest: page-side renderer, filter script, live announcement |
| Risk | Reads as a sibling of every Labs page more than as Stampboard | Cream plus red can read as a template without the product truth | Dark hero in light mode breaks the base's light sweep |

## Recommendation

**Option 1, Monitor on the Sweep**, as the default. It keeps the family base the CEO already
chose, stays in the blue the family leans on, needs the least new pattern work, and still shows the
whole product with its own paper, seal and lamp on the screen. If the CEO wants Stampboard to look
like itself rather than like a Labs sibling, **Option 2** is the stronger choice: it is the only
one where page and product are visibly one object, at moderate cost.

## Contrast

Every page pair each option uses is measured in its own file (section 6), including the focus
ring inside the dark command blocks. All page text pairs pass 4.5:1 and all focus rings 3:1 in
both themes; the one product pair under 4.5:1 is open question 4. Two adjustments came out of the measurement: Option 2's
dark page seal is `#EC6450` instead of the product's `#E4553F` (4.80 against 4.22 on its wash), and
Option 3's yellow legend key has an ink outline on paper.

## Files

- `option-1.md`, `option-2.md`, `option-3.md`: one spec each, design-spec headings.
- `mockups/option-1.html` to `mockups/option-3.html`: self-contained, offline, light and dark,
  EN and TR. Each is about 430 KB because the fonts are inlined.

## Open questions

1. **No `PRODUCT.md`.** The `impeccable` context step found none, and its concept-seed step
   declined without product truth. Writing `PRODUCT.md` is outside `docs/design/landing/`, so this
   design used the repository README, `DESIGN.md`, `index.html` and the issue brief as product
   truth. Product-manager may want to add `PRODUCT.md` before the build.
2. **Copy** is a designer draft in EN and TR; product-manager owns the final strings.
3. **Sample data** is `demo.mjs`'s synthetic `acme` organisation; no real account appears.
4. **Product seal in dark mode.** The product's own `#E4553F` on its 8 % wash measures
   4.13:1 for the 12.5 px seal text (4.49:1 on the plain sheet), under 4.5:1. That is a product finding, not a landing one; it
   shows inside every mockup's product sheets. Recommend a `DESIGN.md` follow-up.
5. **Detector.** `impeccable detect` on the three mockups reports: `cramped-padding` on the
   review shell bar and on full-bleed wrappers whose content is inset by `.wrap` (false positives);
   `tight-leading` 1.2 on short headings and labels, not on body text; `codex-grid-background`
   on every option (the product's own grid paper, and in Option 2 the page ground); `cream-palette`
   on Options 2 and 3 (the product's pinned paper colour, discussed in Option 2).
6. **Phone check.** Measured at 360 px (inside an iframe, since headless Chrome here has a 500 px
   window minimum): no page-level horizontal overflow in any option, both languages. The
   product's departures table scrolls inside its own container at that width. A real-device check
   at 320 to 390 px is part of the build's QA.
