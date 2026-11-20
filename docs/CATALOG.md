# The catalog

`src/shared/catalog.ts` is the whole mod database: two arrays (`GAMES`, `MODS`) plus two lookup maps.
It is plain data on purpose — the installer interprets it, so adding a mod should never require
touching installer code. Types live in `src/shared/types.ts`.

## Adding a mod, start to finish

1. **Add a `GameDef` to `GAMES`** if the game is new.
2. **Add a `ModDef` to `MODS`.**
3. **Check the real asset filename** on the project's releases page and write `assetPattern` against
   it. Set `allowPrerelease` if the project only ever ships prereleases.
4. **Verify the install destination** against the mod's own README — not against where a similar mod
   went.
5. **Run the checks:**
   ```bash
   npm run check-sources
   ```
   resolves every GitHub-backed entry through the app's own resolver, so a pass means the app can
   really download it.
   ```bash
   npm run scan
   ```
   is read-only and prints what each fingerprint looked for against the games on this PC.
6. **Regenerate the README table:**
   ```bash
   npm run docs:table
   ```

No installer changes required. If you find yourself wanting one, see
[Why there are no scripts](#why-there-are-no-scripts).

## GameDef

```ts
{
  id: 'bioshock-remastered',          // stable; state.json keys off it
  name: 'BioShock Remastered',        // shown verbatim in the UI
  steamAppId: 409710,                 // detection + artwork + "Install on Steam"
  xboxFolderNames: ['...'],           // folder under <drive>:\XboxGames
  registryProbes: [{ key: 'HKLM\\SOFTWARE\\...', value: 'EXE Path' }],
  verifyPaths: ['Build/Final'],       // AT LEAST ONE must exist
  standalone: true,                   // no pre-existing install; user picks a folder
  artUrl: 'https://...',              // only for games never on Steam
  stores: ['steam', 'gog', 'epic'],   // badges; also picks the label for a manual path
}
```

| Field | Notes |
|---|---|
| `id` | Never change it after release — `state.json` keys off it and a rename orphans the user's recorded path. |
| `verifyPaths` | Prefer stable **directory** markers over executable names, which vary between storefronts and game revisions. At least one must exist, not all. |
| `standalone` | PC ports with nothing to detect. `verifyPaths: []` then accepts any real directory. |
| `stores` | `steam`, `xbox`, `gog`, `epic`, `rockstar`, `retail`, `standalone`. The first entry is also the label given to a folder the user picks by hand. |

## ModDef

```ts
{
  id: 'bioshock-trilogy-vr-1',
  name: 'bioshock-vr',                // the mod's OWN name, as the author writes it
  gameId: 'bioshock-remastered',
  author: 'VR-Stereo-Hub',
  homepage: 'https://github.com/VR-Stereo-Hub/bioshock-trilogy-vr',
  summary: 'Native VR for BioShock Remastered...',
  kind: 'vr-mod',                     // or 'pc-port'
  maturity: 'beta',                   // stable | beta | alpha | experimental
  source: { ... },
  install: { ... },
  fingerprint: ['...'],               // optional; derived when omitted
  versionFrom: { ... },               // optional
  requiresStore: ['steam'],           // optional
  conflictsWith: ['biovrdev-bioshock-1'],
  requires: ['uevr'],
  options: [ ... ],
  requirements: ['A PCVR headset with a 32-bit OpenXR runtime'],
  notes: ['...'],
}
```

Use the mod's **official** name, as its author writes it — not a tidied-up or invented one. The UI
shows it verbatim and users search by it.

`maturity` drives the badge and its warning: `alpha` and `experimental` are rendered in the caution
colour. `requirements` and `notes` are where the author's own warnings go; they are shown before
anyone installs.

## Sources

### `github`

```ts
source: {
  kind: 'github',
  repo: 'Nibre/MotherVR',
  assetPattern: '^MotherVR\\..*\\.zip$',  // JS regex against the asset FILENAME
  allowPrerelease: true,                  // most VR mods only ever ship prereleases
  tag: 'v1.2.3',                          // optional: pin instead of tracking latest
  tagPattern: '^experimental-',           // optional: only follow releases whose tag matches
}
```

- `assetPattern` is matched against the filename alone. Anchor it. A release with several
  attachments (installer, portable, source, debug symbols) will happily match a loose pattern against
  the wrong one.
- `allowPrerelease` is not cosmetic: without it, a project that ships only prereleases resolves to
  nothing and the mod can never install. With it, resolution switches from the `releases/latest`
  redirect to the atom feed. See [ARCHITECTURE.md](ARCHITECTURE.md#github-without-a-token).
- Asset names drift. MCCVR renamed `-Build.zip` to `Halo-MCC-VR.zip` mid-project, and
  `KozGit/DOOM-3-BFG-VR` was deleted outright and had to be repointed to a fork. `npm run
  check-sources` is how you find out before a user does.
- `tagPattern` is for projects that publish two lines of releases side by side. MGS5VR started
  publishing `nightly-*` builds beside its `experimental-*` releases, and the newest release stopped
  carrying the asset the entry wanted. Only releases whose tag matches are considered.

### `direct`

```ts
source: {
  kind: 'direct',
  url: 'https://alienisolationvr.com/downloads/click.php?id=GRAND-Release.zip',
  versionPattern: '^GRAND-Release(v\\d+(?:\\.\\d+)*)\\.zip$',  // ONE capture group: the version
}
```

For builds the author hosts on their own site behind a stable "latest" link. The link must **redirect
to a filename that carries the version** — that is what makes update checks possible without
downloading anything. Check it with `curl -sIL <url>` before adding an entry. Only the newest build is
ever reachable, so a direct entry cannot pin an older one.

### `manual`

```ts
source: {
  kind: 'manual',
  url: 'https://www.nexusmods.com/.../mods/2875',
  instructions: 'Nexus requires a login to download, so grab the ZIP yourself...',
  filePattern: '\\.zip$',   // sanity-check the file the user picks
}
```

For anything behind a login or not packaged as a release. The app shows `instructions`, opens `url`,
and takes the file the user points it at. There is no version to read, so the filename is recorded as
the version.

## Install plans

```ts
install: {
  stripRootDir: true,
  steps: [
    { from: 'xinput1_3.dll',     to: 'Build/Final' },
    { from: 'bioshockvr.dll',    to: 'Build/Final' },
    { from: 'bvr_steamvr32.dll', to: 'Build/Final', when: 'steamvr', optional: true },
  ],
}
```

| Field | Meaning |
|---|---|
| `stripRootDir` | Drop the single top-level wrapper directory the archive has, so steps can use the paths the author documents. Ignored when anything sits at the top level, since stripping would lose files. |
| `from` | `**` takes the whole archive. `some/dir/**` takes a subtree. Anything else matches the full relative path **or** the bare filename — so a step can say `dxgi.dll` without caring whether the author nested it this release. |
| `to` | Destination relative to the game root; `.` is the root. A named file lands directly in `to` whatever its nesting was. A subtree keeps its structure below the prefix. |
| `when` | Only runs when that option id is enabled. |
| `optional` | Matching nothing is fine. **Without it, a step that matches nothing fails the install** — which is how a changed archive layout gets caught instead of silently half-installing. |

An empty `steps` array marks a **guide-only** entry: the UI shows "Open guide" instead of Install.
Use it for mods whose setup cannot be automated, and for watch entries where upstream has published
no build yet (Perfect Dark VR is one).

### Installers

```ts
install: {
  steps: [],
  installer: {
    run: 'Max Payne 2 VR Setup.exe',                      // inside the extracted release
    uninstall: 'MP2VR-Install/Max Payne 2 VR Setup.exe',  // the copy left in the game folder
    instructions: 'In Setup, select maxpayne2.exe, then choose Install / update (or Uninstall).',
  },
}
```

For a release that is the author's own installer rather than files to copy — one that builds assets
from the user's game, or patches it. Install and Update download and unpack the release, start
`run`, and wait for the user to close it. Both `run` and `uninstall` must be `.exe` files: `start`
keeps a script's console open after it ends, so the wait would never finish. Uninstall reopens `uninstall` when it exists, and the
newest release's installer otherwise.

When the release asset is the installer itself — a bare Setup `.exe` with no archive around it, as
Crysis VR ships — leave `run` out. The download is started as it is, with nothing to unpack.

The manager records nothing for these: the installer owns the files, so the card's state comes from
`fingerprint` and `versionFrom` exactly as for a hand install. Both are effectively required — pick
files the installer **removes** on uninstall (settings files it keeps prove nothing), and read the
version from whatever record the installer writes.

Only use this for an installer that can uninstall what it installs. One that cannot stays guide-only.

Prefer narrow, named steps over `{ from: '**' }`. A wildcard plan copies documentation and debug
symbols into the game folder, produces no derivable fingerprint, and gives uninstall a much larger
blast radius.

## Fingerprints

Relative paths that prove the mod is present, used to spot an install this app did not perform.
Derived automatically from the non-optional copy steps that name a specific file, so most mods need
nothing. **Every** path must exist for a match.

Give an explicit `fingerprint` when:

- the plan is a single wildcard step (nothing to derive from), or
- any part of the payload is optional or runtime-dependent.

That second case is not hypothetical. Removing `optional: true` from a step once pulled
`openvr_api.dll` into a derived fingerprint, and BioShock detection broke for every user on an
OpenXR-only setup. An explicit fingerprint decouples detection from install-plan details, which is
what you want for anything non-trivial.

Pick the paths out of the real archive and prefer files that are unique to this mod. Both BioShock
mods ship an `xinput1_3.dll`; only one ships `BioshockVR.ini`.

## Versions

```ts
versionFrom: {
  path: 'reframework_revision.txt',  // relative to the game root
  field: 'version',                  // JSON field; omit for plain text
  pattern: 'version\\s*=\\s*(\\S+)', // regex with ONE capture group, for text files
  matchesReleaseTag: true,           // can this be compared against a release tag?
}
```

Only a few mods record a version at all — mod DLLs here ship an empty PE version resource. Set
`matchesReleaseTag: false` (or omit it) for anything opaque: REFramework writes a bare commit SHA,
which pins the build exactly but says nothing about which release it belongs to, so it is displayed
and never used to claim an update exists. Guessing there would show a permanent false "update
available".

Mods with no version file are handled by checksum identification instead — see
[ARCHITECTURE.md](ARCHITECTURE.md#naming-the-build). A BOM is stripped before parsing, because the
F.E.A.R. manifest ships one and `JSON.parse` chokes on it.

## Relationships

```ts
conflictsWith: ['biovrdev-bioshock-1'],   // competing implementations
requires: ['uevr'],                       // this is a plugin for that
requiresStore: ['steam'],                 // mod is fussier than the game
```

**`conflictsWith` is declared, never inferred from sharing a game.** Several entries here are layered
and must stay installable together:

| Layered pair | Relationship |
|---|---|
| GRAND-MotherVR → MotherVR | runs on top of it |
| RE4VR / RE9VR → REFramework | addons for it |
| GTA SA/VC DE and MGS Delta plugins → UEVR | plugins for the injector |

Genuinely competing pairs — the two BioShock 1 mods, the two F.E.A.R. mods — do conflict, and the UI
greys out the loser while the other is installed.

`requires` is resolved across the **whole catalog**, not within one game: UEVR is its own standalone
entry, and REFramework sits under a different game than the addons built on it.

`requiresStore` exists because several mods verify the exact executable and reject other editions, so
owning the game is not the same as being able to run the mod. A mismatch shows as a caution badge
rather than blocking install.

## Launching

```ts
launch: 'Halo_MCC_VR/HaloMCCVRLauncher.exe',
```

The tile's Play button starts a game by the first route that applies (`launchTargets()` in
`src/shared/launch.ts`):

1. A present mod's `launch` — an `.exe`, `.bat` or `.cmd` the mod ships, relative to the game root.
2. Steam (`steam://rungameid/<appid>`), for a Steam copy with a `steamAppId`.
3. Otherwise the first `.exe` in `verifyPaths` that exists. Xbox copies are skipped: their executables
   generally refuse to start outside the Xbox app.

Set `launch` **only** when the mod is inactive unless started that way — an injector's launcher, a
wrapper script, a rebuilt executable like `reVC.exe`. Mods that hook the game's own executable
(REFramework, MotherVR, a `dinput8.dll` proxy) leave it unset, so the game starts the normal way and
Steam still handles overlays and cloud saves. Take the name from the mod's own README; a wrong one
quietly falls through to launching the game flat.

It is the same fence the "no scripts" section below asks for: main resolves the path under the game
root, refuses anything that escapes it, and only ever runs a file that came out of the mod's archive.

## Options

```ts
options: [{
  id: 'steamvr',
  label: 'SteamVR compatibility shim',
  description: 'Needed for Index, Vive, WMR and Steam Link...',
  default: true,
}]
```

Options become checkboxes before install and drive the `when` field on steps. Keep them to real
either/or choices the mod's own README describes — the REFramework entries use one for OpenVR vs
OpenXR because the archive ships both runtimes and a marker file telling you to delete one.

## Factories

When several entries differ only in a couple of fields, write a factory rather than copy-pasting.
`reframework()` backs the five Resident Evil entries from one definition:

```ts
reframework({ id: 'reframework-re2', gameId: 're2', gameLabel: 'Resident Evil 2', asset: 'RE2' }),
```

One warning from experience: factory calls are **function calls, not object literals**, so
line-based edits and text-range deletions do not see them the way they see the surrounding entries.
Deleting a neighbouring mod once took all five REFramework entries with it. After editing the
catalog, check the count:

```bash
npm run docs:table
```

It prints `N games, M mods` and rewrites the README table, so a silent loss shows up immediately.

## Why there are no scripts

Every install step has to be reversible, or Uninstall is a lie — and for a tool that writes DLLs into
people's game folders, that is the one thing it has to get right. A `copy` step reverses by restoring
what it displaced. An arbitrary script has no inverse.

A catalog that ships code is also a supply-chain problem the moment the catalog is fetched remotely
rather than bundled, because "catalog entry" and "arbitrary code with filesystem access" become the
same thing. Data can be validated against a schema before it runs.

If a future mod genuinely needs logic, the answer is a **new typed verb with a defined inverse** —
`mkdir`, `ini-set`, or a `run` fenced to executables that came out of the archive the user already
chose to trust — not an escape hatch into arbitrary code.

## Out of scope

Standalone Quest ports (Team Beef's DOOM, Quake and Wolfenstein builds) are **not** PC mods. They are
APKs sideloaded onto a headset with adb; the PC copy of the game is only a source of asset files
copied *to* the headset. Nothing here installs into a PC game folder, so they do not belong in this
catalog.
