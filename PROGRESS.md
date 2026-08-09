# PathVis — Build Progress

> **If you're Claude and the user just said "continue":** read this whole
> file silently, then resume at the top item in "Next up." Don't re-explain
> the plan back to the user — just keep building. This file is a single
> current-status snapshot, not a running log — replace whole sections in
> place when a step completes, don't append a new "Status" block on top of
> an old one.

Build order (from Build_Prompt_Pathfinding_Visualizer.md), 12 steps total:
1. Project scaffold + folder structure — ✅ done
2. Grid/data model — ✅ done
3. Maze generation algorithms — ✅ done
4. Pathfinding algorithms as generator functions — ✅ done
5. Canvas rendering + grid interactions — ✅ done
6. Control panel + stats panel — ✅ done
7. Animation engine tying algorithms to the UI — ✅ done
8. Comparison mode — ✅ done
9. Styling pass — ✅ done
10. Tests — ⬅ **next**
11. README + viva cheat sheet + demo script
12. Final build check

**Note on the user's situation:** the person building this cannot run
`npm run dev` themselves at this stage, and I have no browser in this
sandbox. Four Visualizer-tool previews so far: static palette, live click
demo, timed animated demo, and (this step) the full console redesign —
dark header, bezeled grid instrument with corner brackets + coordinate
readout, recolored buttons. That was the last "hard to picture from text"
step; steps 10-12 are tests/docs/final-check, which don't need a preview.

---

## What's built so far

### Steps 1-8
Unchanged this step functionally — every wire from comparison mode is
intact, only classNames and two new visual components changed. Re-verified
clean (all 7 `.scratch/*.ts` scripts, `tsc -b`, `npm run build`,
`npm run lint`). See git log for per-step detail.

### Step 9: Styling pass ("Drafting Console")
Followed the frontend-design skill's actual process — brainstorm a token
system, critique it against the three flagged generic-AI-default looks,
then build. Full reasoning is in the step 9 commit message and this
conversation; summary of what shipped:

- **Direction**: a dark blueprint-navy console (`#0d1b2e`, genuinely blue —
  not near-black) housing a bright, legible grid instrument, like an
  oscilloscope bezel around a lit display. Chose this over a
  "topographic/parchment" alternative (risked reading too close to the
  warm-cream-plus-serif default) and a "pure terminal" alternative (risked
  reading too close to the near-black-plus-single-neon-accent default).
- **Color**: console `#0d1b2e` / panel `#15243d` / border `#2a3d5c` / ink
  `#e8eef7` / ink-muted `#8a9bb8`, plus semantic signal colors (cyan
  `#4cc9f0` primary, amber `#f2a65a` secondary, green/red for
  confirm/danger). Grid palette (`canvasPalette.ts`) kept its light/dark
  legibility convention (light=passable, dark=wall — the standard,
  legible one) rather than inverting for theme purity; only `wall` was
  re-hexed to a navy pulled from the console family, so walls read as
  "carved from the same material as the console."
- **Type**: Space Grotesk (display) + IBM Plex Sans (body) + IBM Plex Mono
  (data/coordinates/complexity notation) — loaded via Google Fonts links
  in `index.html`. Chose Plex over generic Inter specifically because Plex
  was designed for engineering/technical contexts, which is the register
  this app lives in.
- **Signature element**: `GridInstrument.tsx` (new) — corner-bracket
  registration marks (technical-drawing convention) plus a **live
  coordinate readout** on hover (row/col, monospace, cyan) — genuinely
  useful for a grid tool, not pure decoration, which is what makes it a
  legitimate signature rather than a sticker. Reused by both single-mode
  and `ComparisonView` (which now wraps `GridInstrument` instead of raw
  `GridCanvas`, picking up the label prop it used to render itself).
- **`HowItWorks.tsx`** (new): the PRD §10 "How it works" collapsible panel
  that had been owed since step 6. Native `<details>`/`<summary>` (free
  keyboard accessibility, no custom disclosure JS). Content pulled
  directly from `ALGORITHMS`/`MAZE_ALGORITHMS` via a new `howItWorks`
  field on each registry entry (2-3 sentences per algorithm) — same
  single-source-of-truth principle as the rest of the registries, and
  this content is also what step 11's viva sheet will draw from.
- All other components (`ControlPanel`, `StatsPanel`, `ComparisonStatsPanel`,
  `Legend`, `App`) restyled to the console tokens; stat numbers and
  complexity notation now render in `font-mono`. Added visible
  `focus-visible` rings (cyan) on every interactive control, and a
  `prefers-reduced-motion` rule for decorative transitions — both part of
  the skill's stated "quality floor," not optional polish.

### A real bug caught during this step
The first `npm run build` after the CSS token rewrite produced a CSS
parser warning. Cause: a doc comment read
`...instead of generic slate-*/emerald-* Tailwind defaults.` — the
substring `*/` inside `slate-*/emerald-*` is the CSS comment terminator,
so the comment closed early and `emerald-* Tailwind defaults. */ @theme {`
got fed to the CSS parser as real (broken) CSS. Fixed by rewording the
comment; then grepped the whole source tree for the same pattern
(`-*/`) to confirm it was the only instance. Worth recording because it's
exactly the kind of small, real mistake that's easy to make when writing
comments about wildcard-style utility names, and easy to miss without
actually running the build.

### Verification status
- `tsc -b`, `npm run build`, `npm run lint`: clean (after the fix above).
- All 7 pre-existing `.scratch/*.ts` scripts re-run — zero regressions
  (nothing in this step touched algorithm/grid/animation logic, only
  presentation, so this was a confirmation pass, not new-property
  verification).
- No new scratch script this step — there's no new *logic* to verify,
  only visual presentation, which (as in steps 5-8) I can't see directly
  in this sandbox. Relied on tsc/build/lint plus a Visualizer preview
  (hand-ported, same palette/fonts) to sanity-check the direction before
  committing to it across every component.

### Not started yet
Steps 10-12 (see build order above).

---

## Decisions the user should know about
*(1-14 unchanged from before, see git log on earlier commits.)*

15. **Grid palette kept its light-background convention** rather than
    inverting to match the dark console theme — usability (light=open,
    dark=wall is the most legible, most recognized convention for this
    genre of tool) took priority over total theme purity. The console
    chrome around the grid carries the visual identity instead.
16. **`howItWorks` content was written fresh for this panel**, not reused
    from `shortDescription` — the dropdown needs a one-line summary, the
    explainer panel needs 2-3 sentences with actual substance (the "why,"
    not just the "what"). Both live on the same registry entries as
    distinctly-named fields rather than trying to make one string serve
    both jobs.

---

## Architecture notes (for my own future-session reference)

- **For step 10 (tests), next:** turn the properties already verified via
  `.scratch/*.ts` scripts into the real Vitest suite in top-level
  `/tests`, matching PRD §11 exactly: maze connectivity, BFS/Dijkstra
  path-length agreement, A* ≤ Dijkstra visited count, no-path handling.
  The scratch scripts are close to test-shaped already (they use the same
  `check()`/assert pattern) — this is mostly porting `console.assert` +
  manual `check()` calls to real `expect()` calls, not devising new test
  cases from scratch. Also worth adding: the grid-editing and
  animation-pacing properties already verified, since they're just as
  real and just as easy to keep as regression tests. Decide whether
  `.scratch/` gets deleted once `/tests` supersedes it, or kept as
  documented "how I verified this during development" — leaning toward
  deleting it, since keeping two overlapping-but-not-identical test-like
  directories around is more confusing than helpful once the real suite
  exists.
- **For step 11:** README + viva cheat sheet + demo script. The viva
  sheet's algorithm content should pull from `ALGORITHMS`/`MAZE_ALGORITHMS`'
  `howItWorks` fields (step 9) rather than being written separately —
  keeps it from drifting out of sync with what the app itself says.
- Data model split, algorithm/maze-gen generator contracts, priority
  queue/BFS-queue/A*-heuristic choices, DFS neighbor shuffle, animation
  accumulator pattern, `isBusy`/no-separate-lock reasoning: unchanged,
  see earlier commits.
