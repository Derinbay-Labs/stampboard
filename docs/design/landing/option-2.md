# Option 2: Ledger Page

Landing page for `stampboard.derinbay.com`, design sub-issue #16 of #15. Mockup:
[mockups/option-2.html](mockups/option-2.html) (`?lang=en|tr`, `?theme=auto|light|dark`).

The whole page is set in Stampboard's own world: warm grid paper, ink, ruled ledger sheets and one
vermilion seal. The hero is a ledger sheet whose first entry is the install command, stamped
"Your move". The stage is a binder with index tabs: one product sheet at a time, at its real size.

## Why it leaves the family blue

Stampboard's `DESIGN.md` pins its own palette ("ink on warm grid paper, a black departure board,
a vermilion seal"), and the product is literally a sheet of paper on a spare monitor. A blue page
around it would be a frame in a second visual language. Here the page and the product share one
set of tokens, so the screenshot and the landing look like the same object. The family link stays
through type (Funnel Display, Funnel Sans), the section order, the trust ledger and the large Labs
nameplate in the footer, which keeps its own `--lab-*` blue-slate colours.

The seal's meaning is kept: `DESIGN.md` reserves vermilion for "needs you". On the landing it lands
on the install entry and the final CTA ("Your move": the one action the visitor has to take), on
the four labelled example seals in the close-up, and as the text-selection colour. Inside the
product sheets it keeps the product's own meaning.

Calibration risk: cream plus red is a common generated-page look (the detector flags the cream
ground). It is used here because the product pins exactly this palette; the binder, the double rule
and the real product sheets are what make it specific.

## 1. User goal

As Option 1: understand what the board shows, trust that it is local and read-only, and copy the
install command or open GitHub.

## 2. Entry points

As Option 1. Nav anchors `#board`, `#install`, `#trust`. No login button.

## 3. Flow

1. Hero sheet: H1, a "0 dependencies" figure, the lead, and three ledger entries: Install (stamped,
   with the command and Copy), Try on sample data (`npm run demo`), Read the source (GitHub).
2. Binder: four index tabs (Actions, Pull requests, Issues, Agents) with counts. Each shows a
   caption with what the sheet tells you and the real product sheet beside it.
3. Proof line: 0 dependencies, 10 s refresh, 127.0.0.1, MIT.
4. Close-ups as clippings: the seal and its four meanings (wide), runner plates, agents across
   machines with an unreachable host.
5. Steps sheet, trust sheet, final sheet ("The only row that needs you today.") with a large seal.

## 4. Options

One of three; see [README.md](README.md).

## 5. Screen states

| State | Behaviour |
|---|---|
| Default | Actions tab, 3 running and 3 queued. |
| Empty | Each sheet uses the product's own empty copy if its data is empty (for example "The board is empty. Jobs appear here when a workflow starts."); the mockup does not show an empty sheet; Option 1's Quiet evening scene shows the product's quiet state. |
| Loading | Static; fonts swap from system fallback. |
| Error | Copy failure selects the command and announces "Select the command to copy it". |
| Partial data | The Agents close-up shows `nas` unreachable in the sheet head. |
| Offline | Fully static; works offline once loaded. |
| No JavaScript | Production renders the Actions sheet and the caption at build time; the other tabs need script. |

## 6. Components and tokens

Reuses the base `.btn`, `.seg`, `.cmd`, tabs pattern, steps, trust ledger, footer and Labs plate,
and the product's own `.seal`, ledger and board components. New pattern: the binder (index tabs on a
sheet). It is the base's scene tabs restyled as paper index tabs; same roles and keyboard model.

| Token | Light | Dark |
|---|---|---|
| `--ground` | `#F4F1EA` (product paper) | `#1A1916` |
| `--grid` | `#E7E1D4` | `#22201C` |
| `--wall` (inactive tab) | `#EDE8DD` | `#1D1C19` |
| `--surface` (sheet) | `#FBF9F4` | `#201E1B` |
| `--ink` | `#22201C` | `#ECE6D8` |
| `--mut` | `#685F52` | `#A49D8F` |
| `--line` | `#CFC7B6` | `#3B3832` |
| `--accent` (primary fill) | `#22201C` | `#ECE6D8` |
| `--accent-ink` | `#FBF9F4` | `#1A1916` |
| `--focus` (product `--run`) | `#2F4A7A` | `#93A9D6` |
| `--seal-c` | `#C23523` | `#EC6450` |
| `--cmd-bg` | `#FFFFFF` | `#1A1916` |

The dark page seal is `#EC6450`, one step lighter than the product's `#E4553F`, because the
product value measures 4.22:1 on its own wash and the hero seal is below the large-text size.

### Measured contrast

| Foreground | Background | Ratio | Need |
|---|---|---|---|
| ink `#22201C` | ground `#F4F1EA` | 14.42 | 4.5 |
| mut `#685F52` | ground `#F4F1EA` | 5.56 | 4.5 |
| mut `#685F52` | grid line `#E7E1D4` | 4.82 | 4.5 |
| mut `#685F52` | sheet `#FBF9F4` | 5.96 | 4.5 |
| accent-ink `#FBF9F4` | accent `#22201C` | 15.46 | 4.5 |
| seal `#C23523` | sheet `#FBF9F4` | 5.21 | 4.5 |
| seal `#C23523` | seal wash `#F8EDE7` | 4.77 | 4.5 |
| focus `#2F4A7A` | inactive tab `#EDE8DD` | 7.22 | 3 |
| ink `#ECE6D8` | ground `#1A1916` | 14.13 | 4.5 |
| mut `#A49D8F` | sheet `#201E1B` | 6.17 | 4.5 |
| accent-ink `#1A1916` | accent `#ECE6D8` | 14.13 | 4.5 |
| seal `#EC6450` | seal wash `#2C221E` | 4.80 | 4.5 |
| focus `#93A9D6` | sheet `#201E1B` | 7.04 | 3 |

Mut text is checked against the grid line too, because body copy can sit on a line.

## 7. Copy

| Key | EN | TR |
|---|---|---|
| H1 | Everything open. Stamped where it needs you. | Açık her iş tek sayfada. Size düşenler mühürlü. |
| Lead | Stampboard is a live page for a spare monitor. Actions jobs run on a departure board; pull requests, issues and your Claude Code sessions sit on ruled ledgers below. The rows that wait on you get a rubber stamp. | Stampboard boştaki monitör için canlı bir sayfa. Actions job'ları bir kalkış tabelasında akar; pull request'ler, issue'lar ve Claude Code oturumlarınız altta çizgili defter sayfalarında durur. Sizi bekleyen satırlara mühür basılır. |
| Seal | Your move | Sıra sizde |
| Entries | Install Stampboard / Or try it on sample data / Read the source | Stampboard'u kurun / Ya da örnek veriyle deneyin / Kaynağı okuyun |
| Stage | One sheet for each kind of work. | Her iş türü için bir sayfa. |
| Close-ups | Ink for everything. Red only for you. | Her şey mürekkep. Kırmızı yalnızca size. |
| Steps | Three lines in a terminal. | Terminalde üç satır. |
| Final | The only row that needs you today. | Bugün sizi bekleyen tek satır. |

Shared step, trust and footer strings as in Option 1.

## 8. Accessibility acceptance criteria

- Focus order: skip link, logo, nav, TR/EN, GitHub, hero Copy, hero GitHub, binder tablist (one
  stop, arrows/Home/End), tabpanel (`tabindex="0"`), final Copy, footer links, Labs nameplate.
- Index tabs are 48 px tall (52 px selected); every other control at least 44 px.
- The hero seal is `role="img"` with "Seal: your move"; the decorative final seal is `aria-hidden`;
  the close-up seal row is `aria-hidden` and the definition list beside it carries the meanings.
- The red seal always has its word; no state is carried by colour alone.
- Under 860 px the tab strip scrolls horizontally inside itself; the page does not.
- Reduced motion removes the stamp animation.
- `lang` follows the toggle.

## 9. Platform notes

As Option 1. The grid paper is two CSS gradients, no image. Production should render the binder's
default sheet at build time.

## 10. Open questions

- Shared questions in [README.md](README.md#open-questions).
- If chosen, `DESIGN.md` gains a note that the landing uses `#EC6450` for the dark page seal.

### Trade-offs

- Most distinct and most "Stampboard": the page and the product are one object.
- Leaves the family blue; the family tie is type, structure and the footer plate.
- Cream plus red needs the product truth to read as intended, not as a template.
