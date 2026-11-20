# The interface

Dark-only React app in `src/renderer/`. shadcn/ui components on Tailwind CSS v4, vendored rather than
depended on. The renderer is pure presentation plus `window.vrmm` calls — no Node, no Electron.

## Component tree

```
App                 state, IPC, filtering, grouping
  Header            search, filter toggle, counts, Re-scan
  GameGrid          the grid + where the detail panel goes
    GameTile        key art, game name, game state, mod summary, Play
    GameDetails     panel: game header, path controls, game-level errors
      ModDetails    one block per mod: state, options, requirements, actions
        ProgressLine  download/extract/copy progress
        MaturityBadge
      GameArt       cached header image, or a generated placeholder
```

Helpers live in `src/renderer/src/components/helpers.ts` — pure functions only, no IPC. That file is
the renderer's shared vocabulary: if two components could disagree about what a mod's state is, the
answer belongs there.

## One tile per game, not per mod

Several games carry two competing mods (BioShock 1, F.E.A.R. and Max Payne 2 all do). Those belong side by side
under one heading with an "install only one" warning, not as unrelated tiles a user might install
both of. So the grid is games; mods live in the panel.

## The panel opens after the row, not after the tile

Inserting the panel directly after the selected tile would split that row in half. `GameGrid`
therefore needs the live column count:

```ts
const insertAfter = Math.min(Math.ceil((selectedIndex + 1) / columns) * columns - 1, groups.length - 1)
```

Games are split by initial with full-width letter dividers (`#` for digits and symbols). A divider
starts a fresh row, so in practice the index above is counted from the start of the selected game's
letter section and clamped to that section's last tile, not the grid's.

`useGridColumns` reads the count off the grid's resolved `grid-template-columns` via a
`ResizeObserver`, rather than duplicating the breakpoint maths in JavaScript where it would drift the
moment the CSS changed.

## Mod state

`modState(status)` is the one derived value every card hangs off:

| State | Meaning | What the UI offers |
|---|---|---|
| `no-game` | the game was not found on this PC | Locate folder, Install on Steam |
| `not-installed` | game found, mod absent | Install |
| `unmanaged` | the mod's files are there but we have no install record | Identify, Update, Uninstall (hash-checked) |
| `installed` | we installed it and it is current | Uninstall |
| `update` | we installed it and a newer release exists | Update, Uninstall |

`unmanaged` is the interesting one: we know the mod is present and nothing more. There is no version
to read and no backups for files we never displaced. Installing over it is safe and makes it fully
managed — the installer backs up whatever it displaces — which is what the card says.

### Updates: use `hasUpdate()`

```ts
export function hasUpdate(status: ModStatus): boolean {
  if (modState(status) === 'update') return true
  return modState(status) === 'unmanaged' && unmanagedIsCurrent(status) === false
}
```

There are **two** cases, and missing the second has caused this bug three separate times — on the
tile, on the panel buttons, and in the filter and its count: a managed install whose recorded version
is behind, and a hand-installed one that was identified and turned out to be behind. Anything that
filters, counts or labels updates must call `hasUpdate()` rather than testing `modState === 'update'`
on its own.

`unmanagedIsCurrent()` returns `undefined` rather than guessing when the installed version cannot be
compared with a release tag — a commit SHA pins a build exactly but says nothing about which release
it is. It normalises a leading `v` and strips build metadata after `+`, so `v1.0.0-beta.8` matches
`1.0.0-beta.8+cbf724e`.

`formatVersion()` only prefixes a `v` onto bare numeric versions. Prefixing blindly produced
`vv0.8.3`, since GitHub tags usually carry one already and a manual install's "version" is a filename.

## What the tile says

Two separate lines, because conflating them is genuinely confusing on a grid of games:

- Line one is about the **game**: `Game installed · Steam`, or `Game not installed`.
- Line two is about its **mods**: `3 mods available` when the game is absent, `No mods installed`,
  or `2 mods installed` in green — with `update available` / `N updates available` riding alongside in
  orange rather than replacing it, so the tile says both things at once.

Installed is installed, however it got there; whether this app did the installing is the panel's
business, not the grid's. The update wording is identical on the tile and the mod card, so the two can
never describe the same situation differently.

## Play

A detected game with somewhere to launch from gets a round Play button on its art, top right, with a
tooltip naming the route: `Play with MCCVR Halo Build`, `Play on Steam`, or `Play`. The tile is
itself a button and buttons cannot nest, so Play is a sibling positioned over it. It hides while a mod
for that game is installing — the spinner takes its corner — since launching over files mid-copy is
asking for a crash.

The renderer only sends a game id (`vrmm:launchGame`); main picks the file, the same way
`openGameStore` never accepts a URL. Files run through `cmd /c start` so they get ShellExecute
semantics: a `.cmd` gets a real console, a launcher that wants administrator rights gets a UAC prompt
instead of failing, and `/D` sets the working directory to the file's folder. A failure lands in the
game's error slot and opens its panel, since the tile has nowhere to show one.

## Filters and counts

| Filter | Shows |
|---|---|
| All | everything |
| Installed games | games found on this PC — filtered on the **game**, not on whether any mod is installed, otherwise a freshly detected game with no mods yet would be hidden from the one view meant to show what you own |
| Updates | mods where `hasUpdate()` |

Search matches mod name, game name and author. Games sort A–Z by name with `numeric: true` and
`sensitivity: 'base'`, so "BioShock 2" sits next to its siblings instead of sorting lexically. The
header reads `N mods installed · M with updates`.

## Progress

Install progress is a broadcast on one channel (`vrmm:progress`), tagged with the mod id, driving a
per-mod bar. Phases: `resolving` → `downloading` → `extracting` → `copying` → `done`, or `error`.
A `downloading` phase with no `content-length` reports `total: 0`, which the renderer turns into an
indeterminate bar rather than a bogus percentage. Identify rides the same stream, so its handler
clears the bar in a `finally` however it ends.

## Theming

The app is dark-only by design — it sits beside games, not beside a browser. The dark palette is
defined on `:root` in `src/renderer/src/styles.css` and `<html>` carries a permanent `class="dark"`.
Tokens are shadcn's standard set remapped onto the app's near-black palette, plus three extra
semantic colours the state lines and maturity badges need:

| Token | Used for |
|---|---|
| `ok` | installed and current |
| `warn` | missing prerequisites |
| `caution` | updates available, alpha/experimental maturity, store mismatch, a manually set path |

## If you run `npx shadcn add` again

Two traps, both already paid for:

- **The CLI reads `compilerOptions.paths` from `tsconfig.json`, not `tsconfig.web.json`.** The root
  config is solution-style, so an `@/*` path is declared there purely for the CLI's benefit. Without
  it the CLI silently writes components into a literal `@` directory and rewrites their `cn` import to
  a bare `"cn"` specifier — which then pulls an unrelated npm package of that name into the
  dependencies.
- Generated components must import `cn` from `@/lib/utils`.

Vendored components are meant to be edited; there is no upgrade path to preserve.
