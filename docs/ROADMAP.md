# Where this stands, and what is next

Every item below is also a tick box in [../TODO.md](../TODO.md); this file is the reasoning, that one
is the checklist.

## Done and working

- 29 games, 33 mods in the catalog. 22 install automatically from GitHub; the rest are manual
  downloads or setup guides.
- Game detection across Steam (including extra library drives), Xbox / Game Pass and registry
  probes, with a hand-picked path that auto-detection will never overwrite.
- Install, update and uninstall with backup-and-restore, rollback on failure, traversal guards on
  both `.zip` and `.7z`, and atomic downloads.
- Detection of mods installed by hand, their version read from a metadata file where one exists and
  identified by checksum against release history where it does not, persisted and re-verified locally
  on each launch.
- Removal of a hand-installed mod by hash-matching its files against the release, so nothing is
  deleted on a guess.
- GitHub release resolution with no API token and no quota use, with release notes on updates.
- Conflicts, cross-game prerequisites and per-storefront restrictions surfaced in the UI.
- Game grid with a row-end detail panel, search, filters and counts.
- Steam hand-off for installing a game that is missing.
- Harnesses for the three things that actually break: `e2e`, `scan`, `check-sources`.

Verified against a real machine along the way — MotherVR 0.8.1, BioShock VR v0.8.2 (behind v0.8.3),
HaloCEVR 1.4.0 and REFramework v1.5.9.1 were all identified correctly by checksum, and a Halo MCC
install turned out to be the original pancreations build rather than the catalogued continuation,
which is now its own detect-only entry.

## Next: small and worth doing now

**1. Typecheck `scripts/`.**
Neither tsconfig includes it, so `npm run typecheck` skips the whole directory. A broken string
literal in `e2e-install.ts` got caught by the vite build instead. Add a `tsconfig.scripts.json` that
includes `scripts/**/*` with the node settings, reference it from the solution config, and add it to
the `typecheck` script. Half an hour, removes a whole class of silent breakage.

**2. Order version comparisons instead of testing inequality.**
`modState` treats `latest.version !== installed.version` as "update available". That is wrong in both
directions: a re-cut tag, a catalog entry pinned with `tag`, or a user who installed a newer build by
hand all read as an update, and the UI would happily offer a downgrade. Compare with an ordering
function (dotted-numeric with a prerelease tail, falling back to "differs, direction unknown") and say
"differs" when it genuinely cannot be ordered — the same honesty `unmanagedIsCurrent` already applies.

**3. Persist the release cache.**
The one-hour cache lives in memory, so every launch re-polls one request per distinct repo — roughly
twenty. Writing it next to `state.json` makes a restart free, and gives an offline launch last-known
versions instead of a row of errors. Needs a `cachedAt` per entry and the same defensive parsing
`loadState` uses.

**4. Prune the archive cache.**
`%APPDATA%/vr-mod-manager/cache/` keeps every archive of every version it has ever downloaded,
including ones pulled purely to identify a build. Nothing deletes them. Keep the newest archive per
mod plus a total size cap, pruned on launch.

**5. Unit-test the pure functions.**
There are none today — only the networked e2e. The highest-value targets need no new dependencies
(Node's built-in test runner is enough) and no network: `safeDestination`, `matchEntries`,
`destinationFor`, `findSingleRootDir`, `fingerprintFor`, `hasUpdate`, `unmanagedIsCurrent`,
`formatVersion`. The traversal guard in particular should have tests for `..`, absolute paths and
backslash entries, because it is the one function whose failure is a security bug rather than a
cosmetic one.

**6. An app icon.**
`resources/` is empty, so the installer and taskbar show the default Electron icon.

## Next: bigger, in rough order of payoff

**7. CI, with a scheduled source check.**
There is no `.github/` at all. Typecheck and build on push is table stakes, but the valuable job is
`check-sources` on a weekly schedule: upstream renames assets and deletes repositories, and right now
the first person to find out is a user whose install fails. A scheduled run turns that into an issue
before anyone hits it. It needs no secrets — the resolver uses unauthenticated web endpoints.

**8. Detection for GOG, Epic and Rockstar.**
Catalog entries already advertise those storefronts, but detection only covers Steam, Xbox and
specific registry keys, so a GOG copy of BioShock has to be located by hand. Epic writes per-game
manifests under `C:\ProgramData\Epic\EpicGamesLauncher\Data\Manifests\*.item`; GOG writes
`HKLM\SOFTWARE\WOW6432Node\GOG.com\Games\<id>\path`. Both slot straight into `candidateRoots()` as
new strategies — no changes elsewhere, and `requiresStore` already exists to say when a mod only
works with one of them.

**9. A remote catalog.**
Today the catalog ships inside the app, so adding a mod means shipping a build — which is backwards
for a tool whose entire value is the data. Fetch a signed or at least schema-validated JSON catalog,
fall back to the bundled copy, and never execute anything out of it. The architecture already assumes
this: the catalog is treated as untrusted data, which is exactly the property that makes fetching it
remotely safe. Prerequisites: a published schema, validation on load, a version field, and a visible
"catalog updated" state in the UI.

**10. App auto-update.**
No `electron-updater`, so an installed copy stays where it is. Needs releases published somewhere the
app can read — which means deciding what to do about the repository being private.

**11. A log file and a way to send it.**
An install failure in the wild currently leaves nothing behind. A rolling log under `userData` plus an
"Open log folder" button would make a bug report actionable, and it costs very little.

**12. One-step actions for the awkward paths.**
Three places where the user has to do two things because the app will not guess:
- Removing a hand-installed mod requires Identify first. "Identify and remove" could be one button
  that stops and explains itself if identification fails.
- A conflicting mod is greyed out with "remove that one first". "Replace with this" could uninstall
  the loser and install the winner as one action.
- A missing prerequisite (UEVR, REFramework) is reported but not offered. The panel knows the mod id;
  it could install it.

## Watch list

Catalog entries waiting on upstream, worth re-checking periodically:

- **Perfect Dark VR** — source-only on a `port` branch, no packaged release. Currently a guide-only
  watch entry; give it a real source the moment a build is tagged.
- **GTA Vice City classic** and the **Vice City DE** plugin — community pages rather than release
  downloads, so they stay manual until that changes.
- **GTA San Andreas (2004 classic)** — no PC VR mod exists yet (checked 2026-10-08). The game entry is
  already in the catalog with no mods, so it stays hidden from the grid until one is added. The only
  San Andreas VR options are the Definitive Edition UEVR plugin (catalogued) and a Quest port built
  from the Android release, which is out of scope.
- **Red Dead Redemption 2** — deliberately not in the catalog yet. The only VR mod is Luke Ross's
  R.E.A.L., which is paid Patreon-only, has been pulled from distribution, requires downgrading the
  game, and supports gamepad rather than motion controls. RDR1's own mod (RDRVR) is in the catalog
  and installs normally; RDR2 would be a guide-only entry at best.
- **Halo MCC** — the catalogued continuation and the original pancreations build are separate mods
  with different payloads. The legacy entry is detect-only on purpose.
- The AI-assisted wave of VR mods is producing new projects faster than this list was built. A
  periodic sweep for new entries is as valuable as any feature here.

## Deliberately not doing

- **Standalone Quest ports** (Team Beef's DOOM, Quake, Wolfenstein). They are APKs sideloaded with
  adb; the PC game is only a source of asset files copied *to* the headset. Nothing installs into a PC
  game folder, so they do not fit this tool.
- **Scripted install steps.** See [CATALOG.md](CATALOG.md#why-there-are-no-scripts). If a mod needs
  logic, it gets a new typed verb with a defined inverse.
- **A GitHub API token shipped with the app.** The web endpoints cost no quota and need no secret;
  shipping a token would be both a leak and unnecessary.

## Open questions for you

- **LICENSE.** There is none. It only matters if the repository ever goes public, but that is also the
  point at which it is awkward to add retroactively.
- **Publishing.** Auto-update, a remote catalog and CI-published installers all depend on whether this
  stays private.
