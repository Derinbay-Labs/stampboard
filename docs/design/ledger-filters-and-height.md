# Ledger repo filters, agent counts and board height with Agents

Issue: derinbay/stampboard#32. This spec reuses accepted patterns (the board's Repo chips, the
ledger head, the Agents sheet), so it has no options and does not go to the CEO. Mockups:
[`after-en-light.html`](ledger-filters-and-height/mockups/after-en-light.html) and
[`after-tr-dark.html`](ledger-filters-and-height/mockups/after-tr-dark.html). Both are static
renders of the measured prototype at a 1633x930 viewport. Open them at that size. Where they differ
from this spec, the spec wins:

- The mockups break ties between chips alphabetically; the spec keeps list order.
- The mockups' chip row uses 3px/6px padding; the spec's values give the same +34px.
- The mockups' CSS has a narrow `.l-head` padding rule that is not part of this spec.

## 1. User goal

The owner watches CI, pull requests, issues and Claude Code sessions on one screen. CEO request
(2026-11-17):

- The Actions board shows about one row while the Agents sheet is up. It needs room for several
  jobs, and the other sections should give up height.
- Each ledger needs a per-repo filter.
- The Agents head should say how many leads and how many subagents are running.

## 2. Entry points

The single page `index.html`. Nothing new to navigate to.

## 3. Flow

1. When the Agents sheet appears, the board keeps a fixed number of job rows. The Agents sheet
   gives up height first, the ledgers give up height down to a lower floor, and the board gives
   up height last.
2. The owner clicks a repo chip in the Pull requests or Issues head. That ledger shows only that
   repo's items. Clicking the pressed chip again clears the filter. The two ledgers and the board
   filter independently.
3. The Agents head reads, for example, `Agents 13  4 leads · 9 subagents`.

## 4. Options

Not applicable: these are reused patterns (board Repo chips, ledger head, Agents sheet).

## 5. Height: the shrink order

### 5.1 Root cause (measured)

Measurements use the new demo fixture (section 11): 6 jobs, 4 sessions with one carrying 7
subagents, and 14 PRs and 11 issues across 10 repos.

- At a 1633x930 viewport, the Agents sheet takes its full `min(34vh, 360px)` cap (303px) and the
  ledgers keep `min(300px, 32vh)` (298px).
- The board flex-shrinks to 232px. Its head (127) and filter bar (46) leave 60px for the table:
  the column header plus a 26px sliver of the first row, so 0 complete rows.
- At 1440x800 the board hits its 200px floor, 0 rows show, and the page overflows the viewport by
  13px.

Nothing in the layout gives the board priority: `.board { flex-shrink: 1 }` is the only
shrinkable item, while `.ag` is `flex: none` and the ledgers have a floor.

### 5.2 New rule, only while the Agents sheet shows

There are three rules, applied in this order.

1. **Board: content-sized, with a cap on its job table measured in rows.**
   - The scroll area `.departures` is capped at the column header plus N job rows plus a 30px
     allowance: `34px + N × 58px + 30px`.
   - The 30px fits the 28px "Queued, n jobs" separator. When there is no separator, it shows a
     half-row peek that tells the user the board scrolls.
   - N steps with viewport height:

     | Viewport height | N | Table cap |
     |---|---|---|
     | below 920px | 3 | 238px |
     | 920 to 1039px | 4 | 296px |
     | 1040px and up | 5 | 354px |

   - An empty board stays compact automatically: it is content-sized, and the "board is empty"
     line is 73px, so the board is 200px.
2. **Agents yields first.**
   - Use `flex: 0 1000 auto`. The 1000 shrink weight against the board's 1 makes Agents absorb
     the whole overflow until it hits its floor.
   - The floor is `min-height: 104px`: the 57px head plus the name and host lines of the first
     row of sessions. The floor applies only while the sheet has a session (`.ag:has(.entry)`),
     so the "No sessions / host unreachable" sheet stays content-sized.
   - The counts in its head (section 8) stay visible even at the floor.
   - The existing cap `max-height: min(34vh, 360px)` stays.
3. **Ledgers: the remaining height, above a lowered floor.**
   - The floor is `clamp(150px, calc(55vh - 290px), 232px)`, plus 34px when either ledger shows a
     chip row (section 7).
   - That gives 150px at 800px tall, 222px at 930 and 232px from about 950px.
   - The floor no longer outranks the board.
   - If the board, Agents at 104px and the ledger floor still do not fit, the board yields what is
     left. This happens only when the viewport is 760 to 794px tall.

When the Agents sheet is hidden, nothing changes: the board's `max-height: calc(71vh - 40px)`, the
200px floor and the 1fr ledgers stay as they are today. When the page flows (below 1280px wide or
760px tall), the table cap is removed.

### 5.3 Exact CSS

Replace `index.html` lines 180-183 (`.board { flex-shrink: 1; }` through the
`.ag:not([hidden]) ~ .ledgers` rule):

```css
.board { flex-shrink: 1; }
/* While Agents shows: the board keeps N job rows, Agents yields first, the ledgers keep a lower floor */
.ag { flex: 0 1000 auto; max-height: min(34vh, 360px); }
.ag:has(.entry) { min-height: 104px; } /* head + the first session's name and host lines */
.ag[hidden] { display: none; }
.app:has(> .ag:not([hidden])) .departures { --rows: 3; max-height: calc(34px + var(--rows) * 58px + 30px); }
@media (min-height: 920px) { .app:has(> .ag:not([hidden])) .departures { --rows: 4; } }
@media (min-height: 1040px) { .app:has(> .ag:not([hidden])) .departures { --rows: 5; } }
.ag:not([hidden]) ~ .ledgers { min-height: calc(var(--lf, 0px) + clamp(150px, calc(55vh - 290px), 232px)); }
.ledgers:has(.l-filters:not([hidden])) { --lf: 34px; }
```

In the flowing-layout media query (line 216, after `.ledger { max-height: 75vh; }`), add:

```css
  .app:has(> .ag:not([hidden])) .departures { max-height: none; }
```

`:has()` is the mechanism because the board comes before `.ag` in the DOM, so `~` cannot reach
it. `:has()` works in current Chrome, Edge, Safari and Firefox. Do not toggle a class from
`renderAgents()` instead.

The row metrics come from the current CSS:

| Part | Height |
|---|---|
| Column header (`th`) | 34px |
| Job row (`td` 8px padding, two lines, 1px rule) | 58px |
| Queued separator | 28px |

If a later change alters these, update the formula with them.

## 6. Components and tokens

Reused unchanged:

- `.chip`, `.flabel` and `chips()` from the board.
- `.l-head` and `.l-count` from the ledgers.
- The `.sr` helper.
- The tokens `--ink`, `--muted`, `--rule`, `--sheet` and `--sheet-hover`.

New:

- `.l-filters` is a paper-scoped chip row.
- `.ag-split` is a muted span.

No token, colour or seal change.

### Layout assessment (impeccable `layout`)

- Reading order stays board → Agents → ledgers.
- The board, the primary surface, gets its height back. Agents is supporting live state, so it
  yields first, and its head still carries the counts.
- The chip row groups with its own ledger head, above the double rule, not with the list.
- `impeccable detect` on the prototype reports only the grid-paper background, an advisory. That
  background is the accepted DESIGN.md world, so it is kept.

## 7. Ledger repo filter

### 7.1 Placement and look

The chips go on a second line inside `.l-head`, under the title, count and right-hand summary, and
above the 3px double rule. Do not place them beside the summary: at 1633px the PR head has about
250px of free space between the count and the summary, which holds three chips, and less in
Turkish.

The line is **one row that scrolls horizontally**; it does not wrap.

- Measured with the 10-repo fixture: the PR row fits on one line at 1633px but overflows at 1440px
  (`search 1` is cut at the edge, measured in section 12). Wrapping would add a second 34px line
  exactly where height is scarcest, and a third line with real repo counts.
- A fixed one-line height keeps the height budget in section 5 predictable: exactly +34px.
- Chips are sorted by count, so the busiest repos are always visible. The last visible chip is cut
  at the edge, which shows that the row scrolls.
- Tab moves focus into hidden chips and scrolls them into view.
- Shift+wheel and trackpads scroll the row.

This is the one departure from the board's chip row, which wraps. The reason is the height budget:
the board's filter bar is a single row in practice, while a ledger can hold many repos.

Markup: after `#prNote` and `#isNote`, add
`<div class="l-filters" id="prFilters" role="group" hidden></div>` (and `id="isFilters"`). Its
content mirrors `chips()`:

```html
<span class="flabel">Repo</span>
<button type="button" class="chip" data-v="acme/api" aria-pressed="false">api<b>3</b></button>
```

The CSS goes after `.l-note b`. The chip itself (font, padding 5px 8px, 3px radius, mono count) is
`.chip` unchanged; only its colours move onto paper tokens:

```css
.l-head { flex-wrap: wrap; row-gap: 0; }
.l-filters { flex: 1 0 100%; display: flex; align-items: center; gap: 6px; overflow-x: auto; scrollbar-width: none;
  padding: 4px; margin: 5px -4px -4px; } /* the 4px padding keeps the focus ring inside the scroll box */
.l-filters[hidden] { display: none; }
.l-filters .flabel { flex: none; color: var(--muted); }
.l-filters .chip { flex: none; color: var(--ink); border-color: var(--rule); }
.l-filters .chip b { color: var(--muted); }
.l-filters .chip:hover { background: var(--sheet-hover); border-color: var(--muted); }
.l-filters .chip[aria-pressed="true"] { background: var(--ink); color: var(--sheet); border-color: var(--ink); }
.l-filters .chip[aria-pressed="true"] b { color: var(--sheet); }
```

The pressed chip is an ink fill with sheet-coloured text. This is the paper twin of the board's
cream plate. No new token.

Stacked layout (at most 1280px wide or 760px tall): each ledger is full width, so the row overflows
less often; there is no other change. Narrow layout (at most 760px wide, line 225): no change. The row still scrolls horizontally, and
the head padding stays at 14px 18px 10px.

### 7.2 Behaviour (mirrors the board's Repo filter)

| Rule | Value |
|---|---|
| Chips shown | One per repo with at least one item in **that** ledger's fetched list (`w.prs` / `w.issues`); the count is that repo's item count in the list. |
| Row shown | Only when the ledger has items from 2 or more repos and is not loading or no-data. With 0 or 1 repos the row is `hidden` and the filter clears. |
| Order | By count, descending; ties keep list order, which is the server's attention order (same `.sort` as the board). |
| Label | `shortRepo()`: name only for one owner, `owner/name` for several (same as the board). |
| Selection | Single-select toggle: click selects, a second click on the pressed chip clears. In memory only, not stored, starts clear on load (same as the board). |
| Independence | State `{ pr: null, is: null }`, separate from the board's `filter.repo`. |
| Selected repo disappears | The filter clears silently on the next render (same as the board's "drop a filter whose value is no longer on the board"). |
| Head count and summary | **Do not follow the filter.** `#prCount` stays `prTotal`; `#prNote` and `#isNote` are computed from the unfiltered list, as the board headline ignores its filters. The pressed chip's number is the filtered count. |
| `.more` line | Hidden while a filter is active. Unfiltered it is unchanged. |
| Empty filtered result | Cannot happen: a chip exists only for a repo with items, and a vanished repo clears the filter. No new copy. |
| Redraw | `renderWork()`'s `drawnWork` signature must include both filter values, or a click will not redraw. The click handler on each `.l-filters` toggles, sets `drawnWork = ''` and calls `render()`. |
| Fetch cap | Counts come from the fetched items, at most 300 (`WORK_PAGES = 3` × 100). Past 300 open items, the chips cover only the fetched ones. Accepted for a single-user dashboard. |

## 8. Agents counts

| Element | Value |
|---|---|
| `#agCount` (existing) | **Total agents**: sessions plus all subagents, counted from `data.agents.sessions`, not from rendered rows. Example: `13`. |
| New `<span class="ag-split" id="agSplit">` | Right after `#agCount`, inside `.l-head`. Style: `.ag-split { color: var(--muted); font-size: 13px; }`. It sits on the head's baseline, with the head's 12px gap. |
| Leads | The number of top-level session rows (`sessions.length`). |
| Subagents | The sum of `session.subagents.length`. |
| Format | `{leads} · {subagents}`. The middle dot is `aria-hidden="true"`, followed by a `.sr` ", " so screen readers say "4 leads, 9 subagents". |
| Zero subagents | Shown explicitly: `3 leads · 0 subagents`. |
| No sessions (only an unreachable host) | `#agCount` and `#agSplit` are both empty, as today. |
| Unreachable note | `#agNote` keeps `margin-left: auto` on the right. The split never moves into it. |
| Numbers | `num.format`: locale grouping and tabular figures inherited. |

## 9. Screen states

| Section | Empty | Loading | Error | Partial data | Offline |
|---|---|---|---|---|---|
| Board height | No jobs: 200px compact (head + empty line). The cap does not apply because there is no table. | Unchanged (no table). | The alert renders inside `.departures`, so it counts against the row cap: with a kept scan plus an alert (about 66px) the board shows N−1 rows. Accepted, because the alert matters more than one row. | Two-line filter bar: Agents yields first but has only 5px above its floor at 930, so the board loses about 25px. With the section 11 fixture that is 3 rows at 1633x930 (derived from the measured metrics, not measured). | Last data stays; height rules unchanged. |
| Ledger chips | No items: row hidden. | Row hidden. | Kept scan shown: chips follow it. No data: row hidden. | Only one repo: row hidden. One ledger with chips, the other without: heads differ by 34px (accepted). | Last data; chips unchanged. |
| Agents counts | Unreachable only: no counts. | Sheet hidden until data. | n/a | Session without `subagents` array: counts 0. | Last data. |

## 10. Copy

| Key | TR | EN | Notes |
|---|---|---|---|
| `agLeads(n)` (new) | `${n} lead` | `${n} lead` / `${n} leads` (n = 1 / other) | "Lead" is the CEO's term; Turkish keeps the English word, like `job` and `runner`, and does not inflect after a numeral. |
| `agSubs(n)` (existing) | `${n} alt ajan` | `${n} subagent` / `subagents` | Reused unchanged. |
| `filterRepo` (existing) | `Repo` | `Repo` | The chip-row label. |
| `prRepoFilter` (new, aria-label of `#prFilters`) | `Pull request'leri repoya göre filtrele` | `Filter pull requests by repository` | Distinct group names, so the two chip sets are told apart. |
| `isRepoFilter` (new, aria-label of `#isFilters`) | `Issue'ları repoya göre filtrele` | `Filter issues by repository` | |

## 11. Demo fixture change (`demo.mjs`)

The current fixture has 3 sessions with no 7-subagent session and 4 repos, so it cannot show this
state.

Append to `prs`:

```js
pr('billing', 64, 'Prorate plan changes mid-cycle', { updated: 25, review: { state: 'requested', by: [] }, author: 'lee', branch: 'feat/proration' }),
pr('infra', 211, 'Move the runners to the new subnet', { updated: 60, ci: { state: 'running', failed: 0, total: 3 }, author: 'dana', labels: ['infra'] }),
pr('auth', 37, 'Rotate signing keys every 90 days', { updated: 200, review: { state: 'approved', by: ['dana'] }, seal: 'approved', author: 'sam' }),
pr('search', 19, 'Index archived projects', { updated: 700, author: 'kim' }),
pr('cli', 103, 'Add a --json flag to status', { updated: 1100, review: { state: 'requested', by: [] }, author: 'lee' }),
pr('design-system', 48, 'Tabular numerals in data tables', { updated: 2600, author: 'kim', labels: ['design'] }),
pr('api', 319, 'Retry webhook delivery with backoff', { updated: 8, ci: { state: 'running', failed: 0, total: 6 }, author: 'dana', branch: 'feat/webhook-retry' }),
pr('mobile', 79, 'Pull to refresh on the inbox', { updated: 3100, author: 'lee' }),
```

Append to `issues`:

```js
issue('billing', 66, 'Choose how to round prorated amounts', { updated: 50, labels: ['decision'], seal: 'decision', comments: 4 }),
issue('infra', 214, 'Runner disk fills up after nightly builds', { updated: 180, labels: ['bug'], assignees: ['dana'], comments: 2 }),
issue('auth', 40, 'Password reset link expires too early', { updated: 800, labels: ['bug'] }),
issue('search', 22, 'Typo tolerance for repository names', { updated: 3000, labels: ['enhancement'] }),
issue('cli', 105, 'Shell completion for zsh', { updated: 5000, labels: ['enhancement'], comments: 1 }),
issue('web', 146, 'Empty state for the invoices table', { updated: 6000, labels: ['design'] }),
```

Replace the `release-lead` session with one that carries 7 subagents, and add a fourth session:

```js
{
  host: 'build-box', name: 'release-lead', agent: 'team-lead', status: 'busy', cwd: 'acme/web', startedAt: ago(95), updatedAt: ago(1),
  subagents: [
    { type: 'web-developer', description: 'Billing page empty states', model: 'sonnet', background: true, updatedAt: ago(1) },
    { type: 'web-developer', description: 'Invoice table pagination', model: 'sonnet', background: true, updatedAt: ago(2) },
    { type: 'backend-developer', description: 'Proration endpoint', model: 'sonnet', background: true, updatedAt: ago(1) },
    { type: 'code-reviewer', description: 'Review billing PR #141', model: 'opus', background: false, updatedAt: ago(4) },
    { type: 'qa-engineer', description: 'Verify the billing slice', model: 'sonnet', background: true, updatedAt: ago(6) },
    { type: 'Explore', description: 'Find the chart library usages', model: null, background: false, updatedAt: ago(8) },
    { type: 'ux-designer', description: 'Invoice history spec', model: 'opus', background: true, updatedAt: ago(9) },
  ],
},
{ host: 'build-box', name: 'infra-runners', agent: null, status: 'idle', cwd: 'acme/infra', startedAt: ago(300), updatedAt: ago(40), subagents: [] },
```

Set `repoCount: 10`. The jobs stay as they are: 3 running and 3 queued, so the separator falls
inside the first four rows, which is the hardest case for the row guarantee.

## 12. Acceptance (measured on a scratch prototype of exactly this spec)

The measurements use headless Chrome with the fixture above, `?lang=en`, light and dark (identical
results; Turkish is identical too). "Rows" means job rows fully inside the board's scroll area
below the sticky header.

| Viewport | Board rows before | Board rows after | Agents after | Ledger visible entries before → after | `scrollHeight` = viewport |
|---|---|---|---|---|---|
| 1633x930 | 0 (board 232px) | **4** (board 468px) | 109px | 4 → 2 full + 80% of the 3rd | before yes, after yes |
| 1440x800 | 0 (board 200px, page overflows 13px) | **3** (board 410px) | 109px | 3 → 1 full + 60% of the 2nd | before no, after yes |
| 1920x1080 | 3 | **5** | 190px | 4 → 2 full + 95% of the 3rd | yes / yes |
| 1633x835 (a 1633x930 *window*) | 0 | **3** | 128px | 3 → 1 full + 90% of the 2nd | yes / yes |
| 1440x705 (a 1440x800 *window*: flowing layout) | 6 (all) | 6 (all), inferred from the flow rule; measured 6 at 1280x800 | content | unchanged | page scrolls by design |

Required checks for the developer and QA:

1. With the fixture, at viewport 1633x930: at least 4 complete job rows. At 1440x800: at least 3.
   At 1920x1080: at least 5. Each in light and dark, and with `documentElement.scrollHeight ===
   innerHeight`.
2. Agents hidden (no sessions): board, ledgers and footer heights are unchanged against `master`,
   apart from the +34px chip line inside the ledger heads. The board measured 581px (6 rows) at
   1633x930 and 1920x1080, before and after.
3. Board empty with Agents showing: the board is 200px, and Agents and the ledgers take the rest
   (measured: Agents 303px, ledgers 330px at 1633x930).
4. A two-line board filter bar (in a fixture without a separator in the first four rows) at
   1633x930 shows 4 rows, measured, with Agents at its 104px floor. With the separator in range
   it is 3 rows.
5. Clicking `api` in the Pull requests head shows only `api` items, the chip is pressed, and the
   count `14` and the summary are unchanged. Clicking it again restores all items. The Issues
   ledger and the board are unaffected.
6. The Agents head reads `Agents 13` followed by `4 leads · 9 subagents` (TR: `Ajanlar 13`,
   `4 lead · 9 alt ajan`). The dot is not announced; the split is read as "4 leads, 9 subagents".

## 13. Accessibility acceptance criteria

- **Contrast**, measured against the `--sheet` background:

  | Pair | Light | Dark |
  |---|---|---|
  | Chip text (`--ink` on `--sheet`) | 15.5:1 | 13.4:1 |
  | Chip count and the Repo label (`--muted`) | 6.0:1 | 6.2:1 |
  | Count on hover | 6.3:1 | 5.5:1 |
  | Pressed chip (`--sheet` on `--ink`) | 15.5:1 | 13.4:1 |
  | Focus ring | 8.4:1 | 7.0:1 |
  | `.ag-split` (`--muted`) | 6.0:1 | 6.2:1 |

  - The 1px `--rule` chip border is 1.6:1 (light) and 1.4:1 (dark), the same as the board's
    accepted chips. The label text identifies the control, and the pressed state is a full fill,
    15:1 against the sheet.
- **State is not colour alone:** pressed is a fill inversion plus `aria-pressed="true"`.
- **Screen readers:**
  - Each chip row is `role="group"` with the aria-label from section 10.
  - Each chip is a `<button>` with `aria-pressed`, and its accessible name is "api 3".
  - The counts span reads as in section 12, check 6.
- **Focus order:** board chips → board rows → Agents body (a tab stop only when it scrolls) → PR
  chips → PR item links → Issue chips → Issue item links.
  - Focusing a chip scrolls it fully into view inside `.l-filters`.
  - The 2px focus ring is not clipped by the scroll box (4px padding).
- **Target size:** chips are 25px tall with 6px spacing. That passes WCAG 2.2 AA 2.5.8 (24px), but
  not the 44pt house bar; see section 16.
- **Motion:** none added.

## 14. DESIGN.md lines to update

- Line 8 (Ledgers): add "a one-line, horizontally scrolling Repo chip row under the head when the
  ledger spans two or more repos; paper chips (ink text, ink fill when pressed); single-select,
  independent of the board; the head count and summary stay unfiltered."
- Line 9 (Agents sheet): replace "The sheet scrolls under a `min(34vh, 360px)` cap (three rows of
  sessions); while it shows, the ledgers keep a `min(300px, 32vh)` floor and the board yields
  height (it scrolls inside)." with "The head shows the total (sessions + subagents) and a muted
  `n leads · m subagents` split. While it shows, the board keeps 3, 4 or 5 job rows (below 920px,
  920 to 1039px, and 1040px or more tall). The sheet yields first, down to a 104px floor, and
  scrolls under its `min(34vh, 360px)` cap. The ledgers keep a `clamp(150px, 55vh - 290px, 232px)`
  floor (+34px with chip rows)."
- Line 14 (Layout): no change.

## 15. Platform notes

Web only. Desktop browsers with `:has()` support (all current evergreen browsers).

## 16. Open questions

- The chip row hides its scrollbar. A mouse without a horizontal wheel reaches overflowed chips
  only by Shift+wheel or Tab. If the owner's real repo count overflows often, add a right-edge
  fade, which needs a JS overflow flag. Decides: ux-designer after the owner has used it for a
  week.
- Chips are 25px tall, below the role card's 44pt touch bar, the same as the board's accepted
  chips. This is a desktop wall display, so it is accepted here. Decides: ux-designer if a touch
  use appears.
- At 1440x800 the ledgers show about 1.6 entries each while Agents shows. That is the cost of 3
  board rows. If it reads too tight, lower N to 3 rows without the separator allowance (+30px to
  the ledgers). Decides: CEO feedback on the shipped build; not a design pick.
