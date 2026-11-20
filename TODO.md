# TODO

Every outstanding item, as a checklist. The reasoning behind each one is in
[docs/ROADMAP.md](docs/ROADMAP.md); this file is the short version you tick off.

## Now — small, self-contained

- [ ] **Typecheck `scripts/`.** Neither tsconfig includes it, so `npm run typecheck` skips the whole
      directory. Add `tsconfig.scripts.json` (node settings, `include: ["scripts/**/*"]`), reference
      it from `tsconfig.json`, add it to the `typecheck` script.
- [ ] **Order version comparisons.** `modState()` in `src/renderer/src/components/helpers.ts` treats
      `latest.version !== installed.version` as an update, so a re-cut tag, a pinned `tag`, or a
      newer hand-installed build all read as "update available" — and the UI would offer a
      downgrade. Compare with ordering; say "differs" when it cannot be ordered.
- [ ] **Persist the release cache.** The one-hour cache in `src/main/ipc.ts` is in memory, so every
      launch re-polls ~20 repos. Write it beside `state.json` with a `cachedAt`, parsed as
      defensively as `loadState()` does, so a restart is free and an offline launch shows
      last-known versions.
- [ ] **Prune the archive cache.** `%APPDATA%/vr-mod-manager/cache/` keeps every archive of every
      version forever, including ones downloaded only to identify a build. Keep the newest per mod
      plus a total size cap, pruned on launch.
- [ ] **Unit-test the pure functions.** None exist today — only the networked e2e. Node's built-in
      test runner is enough, no new dependencies: `safeDestination` (`..`, absolute paths, backslash
      entries — its failure is a security bug, not a cosmetic one), `matchEntries`,
      `destinationFor`, `findSingleRootDir`, `fingerprintFor`, `hasUpdate`, `unmanagedIsCurrent`,
      `formatVersion`.
- [ ] **Add an app icon.** `resources/` is electron-builder's `buildResources` dir and is empty, so
      the installer and taskbar use the default Electron icon.

## Next — bigger, in rough order of payoff

- [ ] **CI, with a scheduled source check.** No `.github/` at all. Typecheck + build on push, and —
      the valuable part — `check-sources` weekly, so an upstream asset rename or deleted repo
      becomes an issue instead of a user's failed install. Needs no secrets.
- [ ] **Detection for GOG, Epic and Rockstar.** The catalog already advertises those storefronts but
      only Steam, Xbox and registry probes are implemented, so a GOG copy has to be located by hand.
      Epic: `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests\*.item`. GOG:
      `HKLM\SOFTWARE\WOW6432Node\GOG.com\Games\<id>\path`. Both drop into `candidateRoots()` as new
      strategies.
- [ ] **A remote catalog.** Adding a mod currently means shipping a build, which is backwards for a
      tool whose value is the data. Fetch schema-validated (ideally signed) JSON, fall back to the
      bundled copy, execute nothing from it. Needs: published schema, validation on load, a version
      field, a visible "catalog updated" state.
- [x] **App auto-update.** `electron-updater` against this repo's GitHub releases; publish with
      `npm run release` after bumping the version.
- [ ] **A log file.** An install failure in the wild leaves nothing behind. A rolling log under
      `userData` plus an "Open log folder" button makes a bug report actionable.
- [ ] **One-step actions for the awkward paths.** Three places where the user does two things
      because the app will not guess:
  - [ ] "Identify and remove" for a hand-installed mod, instead of requiring Identify first.
  - [ ] "Replace with this" on a conflicting mod — uninstall the loser, install the winner.
  - [ ] Offer to install a missing prerequisite (UEVR, REFramework); the panel already knows its id.

## Watch list — waiting on upstream

- [ ] **Perfect Dark VR** — source-only on a `port` branch, no packaged release. Give it a real
      source the moment a build is tagged.
- [ ] **GTA Vice City classic**, and the **Vice City DE** plugin — community pages rather than
      release downloads; manual until that changes.
- [ ] **GTA San Andreas (2004 classic)** — no PC VR mod yet. The game entry is ready and waiting;
      add a mod the moment one appears.
- [ ] **Red Dead Redemption 2** — not in the catalog. The only mod is Luke Ross's R.E.A.L., which is
      paid Patreon-only, was pulled from distribution, needs the game downgraded, and is gamepad-only
      for controls. Add it as a guide-only entry if that is wanted, or revisit if a free one appears.
- [ ] **Black Ops III (BO3VR)** — MrDoodsterVR's mod is shown in videos only, with no public
      build. The entry is guide-only; give it a real source and install plan once one ships.
- [ ] **Halo MCC** — the catalogued continuation and the original pancreations build are separate
      mods with different payloads; the legacy entry stays detect-only. Re-check periodically.
- [ ] **Sweep for new mods.** The AI-assisted wave is producing VR mods faster than this catalog was
      built; a periodic sweep is worth as much as any feature here.

## Open questions — yours to decide

- [ ] **LICENSE.** There is none. Only matters if the repo goes public, which is also the point at
      which it is awkward to add retroactively.
- [x] **Publishing.** The repo goes public; releases are published there.

## Deliberately not doing

Not a backlog — recorded so they do not get re-proposed. Reasoning in
[docs/ROADMAP.md](docs/ROADMAP.md#deliberately-not-doing).

- Standalone Quest ports (Team Beef). APKs sideloaded with adb; nothing installs into a PC game
  folder.
- Scripted install steps. A new typed verb with a defined inverse instead.
- A shipped GitHub API token. The web endpoints cost no quota and need no secret.
