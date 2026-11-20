# Architecture

How the app is put together, and why. Read [CATALOG.md](CATALOG.md) for the data format,
[UI.md](UI.md) for the renderer, [DEVELOPMENT.md](DEVELOPMENT.md) for the toolchain and
[ROADMAP.md](ROADMAP.md) for what is not done yet.

## The one idea

Everything here follows from a single decision: **the installer is an interpreter over data, not a
collection of per-mod code.** `src/shared/catalog.ts` is plain data; `src/main/services/install.ts`
reads it and copies files. Adding a mod means adding an object to an array.

Two consequences shape the rest of the design:

- Every action the installer can take must be **reversible**, or Uninstall is a lie. A `copy` step
  reverses by restoring what it displaced. An arbitrary script has no inverse, so there are no
  scripts. The one hand-off is a mod whose release *is* its author's installer (`installer` in
  [CATALOG.md](CATALOG.md#installers)): the manager starts it and waits, and Uninstall reopens it.
  Reversal is that installer's job, so only installers that can uninstall get this treatment.
- The catalog is **data we distrust like any other input**. Its `to` paths get the same traversal
  checks an archive entry does, because the two become the same thing the moment the catalog is
  fetched remotely instead of bundled.

## Process model

```
main process                           renderer (React)
------------                           ----------------
window + protocol   src/main/index.ts
ipc handlers        src/main/ipc.ts  <--- preload bridge ---> window.vrmm
services/                                 src/preload/index.ts
  detect  steam  registry
  github  download  archive
  install  presence  identify
  store  artwork
                     shared: types.ts  api.ts  catalog.ts
```

The renderer never touches Node or Electron. `src/shared/api.ts` is the single contract: the preload
exposes exactly that interface as `window.vrmm`, and main registers one `ipcMain.handle` per channel
in `IPC`. Adding a capability means adding to that file first, then both sides.

Window settings that matter (`src/main/index.ts`):

- `contextIsolation: true`, `nodeIntegration: false`. `sandbox: false` is deliberate — the preload
  imports from `node_modules`, which the sandbox forbids; isolation is the wall that actually matters.
- `setWindowOpenHandler` and `will-navigate` both deny in-window navigation and hand `http`/`https`
  links to the user's own browser. The renderer is an app shell, never a browser.
- `requestSingleInstanceLock()`. Two copies writing into the same game folder is a data hazard, so a
  second launch focuses the first window.

## Request flow

`listStatuses` is the renderer's one big read, and it does four things per catalog entry:

1. Join the mod with its game and with `state.json` (`games[gameId]`, `installed[modId]`).
2. For a detected game with no install record, ask `presence.ts` whether the mod's files are on disk
   anyway — a hand-installed mod.
3. For such a mod, read a version from its own metadata file if it ships one; otherwise fall back to
   a build identified earlier by checksum, re-verifying the stored signature against the files first.
4. Resolve the newest release for every GitHub-backed mod, in parallel, cached.

A failure in step 3 or 4 is per-mod data (`latestError`), never a reason to fail the list. Errors
degrade to an empty or partial answer rather than crossing the IPC boundary — see `asResult` and
`orFallback` in `ipc.ts`.

## Game detection

`src/main/services/detect.ts` tries three strategies per game, in order of trust, and takes the first
candidate that verifies:

| Order | Strategy | How |
|---|---|---|
| 1 | Steam | `SteamPath` from the registry, every library in `libraryfolders.vdf`, then `appmanifest_<appid>.acf` |
| 2 | Xbox / Game Pass | probe `<drive>:\XboxGames\<title>\Content` on every live drive letter |
| 3 | Registry | specific keys named by the catalog, e.g. Halo CE's `EXE Path` |

Notes:

- `verifyGameRoot` requires **at least one** of `verifyPaths` to exist, not all of them. The same
  game ships different markers across storefronts and revisions, so "all" would reject real installs.
  The goal is to catch a completely unrelated folder, not to prove an install is pristine.
- Drive probing is a cheap `access()` per letter, run concurrently. No `wmic` or PowerShell —
  slow to spin up, and `wmic` is on its way out on Windows 11.
- A registry value may point at the exe or at the folder depending on which installer wrote it, so an
  `.exe` value collapses to its directory.
- A path the user picked by hand is stored with `manual: true` and **auto-detection never overwrites
  it**.
- `standalone` games (PC ports) are never auto-detected; the user picks an empty folder to install
  into, and any real directory is acceptable.

## Mods installed by hand

Install records only cover installs this app performed, so a mod the user dropped in themselves would
otherwise be invisible. `src/main/services/presence.ts` looks for the mod's own files instead.

Each mod has a **fingerprint**: relative paths that prove it is present. It is derived automatically
from the copy steps that name a specific file (which is exactly where the installer puts them), so
most mods need nothing:

```ts
install: { steps: [{ from: 'dxgi.dll', to: '.' }] }   // fingerprint: ['dxgi.dll']
```

A plan that is one wildcard step has no derivable signature and needs an explicit `fingerprint`.

**Every** fingerprint path must exist for a match. Requiring all of them stops one shared filename
from misattributing a mod — both BioShock mods ship an `xinput1_3.dll`, but only one ships
`BioshockVR.ini`. Pick the paths out of the real archive; `npm run scan` prints what each fingerprint
looked for, so a wrong guess is obvious.

Deriving a fingerprint from install steps couples detection to install-plan details, and that has
bitten once already: dropping `optional: true` from a step pulled `openvr_api.dll` into the derived
fingerprint, and detection broke for anyone on an OpenXR-only setup. **If a mod's plan has
runtime-dependent or optional pieces, give it an explicit fingerprint** and decouple the two.

### Naming the build

Presence alone cannot name a version — the files carry none. Mod DLLs in this catalog ship an empty
PE version resource, and only a few mods (REFramework, KisakCOD VR, F.E.A.R. VR) write a metadata
file. Two mechanisms, in order:

1. **`versionFrom`** reads the version out of a file the mod ships (JSON field, regex capture, or the
   whole trimmed file). `matchesReleaseTag` says whether that value can be compared against release
   tags. REFramework's `reframework_revision.txt` is a bare commit SHA: precise, but not comparable,
   so it is displayed and never used to claim an update is available.

2. **Checksum identification** (`src/main/services/identify.ts`) for everything else. It walks release
   history newest-first, up to `MAX_RELEASES = 12`, hashing the mod's fingerprint files against each
   release until one matches exactly. That costs a download per release inspected, so it runs on
   demand from a button rather than at launch. Archives land in the installer's own cache, so
   identifying a mod and then installing it does not fetch twice.

The answer is persisted in `state.json` under `identified[modId]`, together with a `signature` — a
hash over the mod's own files at the time. On every launch the signature is re-checked locally; if the
user has since replaced the files by hand it stops matching and the record is dropped. There is
deliberately **no "is this the latest" flag** stored, because that would go stale the moment upstream
publishes. It is derived by comparing against the current release whenever it is needed.

## Sources

### GitHub, without a token

`api.github.com` allows **60 anonymous requests an hour, per IP** — which this app can exhaust just
by being restarted a few times, since it resolves one release per distinct repo.

So release lookups use the ordinary github.com pages instead, which are not part of that budget.
Between them they carry everything a lookup needs:

| Need | Endpoint |
|---|---|
| Newest stable tag | `/{repo}/releases/latest` → 302 to the tag, or back to `/releases` when every build is a prerelease |
| Newest tag including prereleases | `/{repo}/releases.atom` |
| Asset filenames | `/{repo}/releases/expanded_assets/{tag}` |
| Release title and notes | `/{repo}/releases.atom` (same fetch) |
| Download | `/{repo}/releases/download/{tag}/{asset}` |

No token, nothing to ship. `resolveLatestRelease()` tries this path first and falls back to the REST
API only if the markup ever changes shape; the error reported is the web path's, since that is the one
the app actually relies on.

Two things worth knowing before "optimising" this:

- **Conditional requests are not a way out.** An unauthenticated `304 Not Modified` *still*
  decrements the limit. Only authenticated requests get that exemption.
- **Release downloads never counted anyway.** They are served from a separate host, so installing is
  not what exhausts the budget — polling for versions is.

Lookups are cached in `ipc.ts` for an hour, keyed by repo + asset pattern + tag + prerelease flag (or
URL + version pattern for a direct link), and
concurrent calls for the same key share one in-flight promise. Three catalog entries share the
BioShock trilogy repo and five share REFramework, so a full refresh costs one request per distinct
repo. The cache is in memory only — it starts cold on every launch.

### Direct link

Some authors host builds on their own site behind one stable "latest" link that redirects to a
versioned file (`click.php?id=GRAND-Release.zip` → `files/GRAND-Releasev0.6.2.zip`). `resolveDirect()`
in `services/direct.ts` follows that chain with a single `HEAD` request and reads the version out of
the final filename with the entry's `versionPattern`, so update checks cost no download. A link that
lands on an HTML page is reported as broken rather than downloaded.

Only the newest build is reachable, so there is no history to walk: checksum identification compares
against that one build, and removing an unmanaged install only works when it *is* that build.
`resolveRelease()` in `services/release.ts` is the single entry point over both downloadable kinds.

### Manual

For anything behind a login (Nexus) or not packaged as a release. The app shows the instructions,
opens the download page, and lets the user point it at the file they downloaded; `filePattern`
sanity-checks the pick. A manual download carries no version metadata, so the recorded "version" is
the filename — the honest answer.

## Install

A plan is a list of copy steps, interpreted in order:

1. Acquire the archive — resolve and download to the cache, or take the user's manual pick.
2. Extract to a temp dir and list the entries. `stripRootDir` drops the single wrapper directory that
   GitHub archives usually have, so steps can use the paths the mod author documents.
3. For each step whose `when` option is enabled: match entries, resolve each destination inside the
   game root, create missing directories (recording **every** level), displace any existing file into
   `backups/<modId>/`, copy.
4. Write the install record: every file written, every directory created, the options used.

Uninstall reverses that newest-first: delete what we wrote, rename backups back, then `rmdir` the
directories we created, deepest first, and only if they came out empty.

### Guarantees

- **Nothing is overwritten.** A displaced file moves to `%APPDATA%/vr-mod-manager/backups/<modId>/`
  and is restored on uninstall.
- **Failures roll back.** If step 3 of 4 fails, the first two are undone. A half-installed mod is
  worse than no mod.
- **Updates reinstall cleanly.** Installing over an existing install uninstalls first (silently — a
  `done` event there would tell the renderer the whole job had finished), so a new version never
  stacks on files the old one left behind.
- **Zip-slip is blocked, for both formats.** The extractor validates the *entire* entry manifest
  before writing a byte, so a hostile archive cannot half-extract. For `.7z` the archive is listed and
  every entry checked before `7za` is allowed to write anything — the external tool is not trusted to
  refuse a `..` entry itself. Catalog `to` paths get the same check.
- **Downloads are atomic.** Bodies stream to a `.part` file and are renamed on completion, so a
  partial download never looks finished. Hashing is streamed too, so a 500 MB archive costs no more
  memory than downloading it did.
- **Steam URLs are built in main.** The renderer passes a game id to `openGameStore`, never a URL;
  main looks up the appid and builds `steam://install/<appid>`. `steam://` has verbs well beyond
  installing, and nothing the renderer sends can widen that. `launchGame` works the same way: a game
  id in, and main chooses between `steam://rungameid/<appid>` and a catalog-named file under the game
  root. `openExternal` likewise refuses anything that is not `http`/`https`.

### Removing a mod we did not install

There is no manifest and no backups for a hand-installed mod, so the only safe rule is: **delete a
file only if its bytes are identical to the ones that release shipped.** `uninstallUnmanaged()`
re-downloads the identified release and hash-compares every candidate file. A file the mod displaced,
or one the user edited, is left alone rather than destroyed on a guess. Anything the mod replaced
still cannot be restored, and the UI says so plainly. It requires an identified build first, which is
why Identify exists as its own action.

Option-gated steps are all considered here, because which options a hand-install used is unknowable —
the hash check is what keeps it safe, not the plan.

## Archives

Zip through `adm-zip`, `.7z` through the `7za` binary bundled by `7zip-min`. `extractArchive()` and
`listArchiveEntries()` dispatch on the extension, so a catalog entry never says which it is.

Packaging note: `7zip-bin` ships a real executable, so it is in electron-builder's `asarUnpack` and
both packages are external to the main bundle. A binary inside an asar cannot run.

## Artwork

Header images come from the Steam CDN, keyed by the `steamAppId` already in the catalog:

```
https://cdn.cloudflare.steamstatic.com/steam/apps/<appid>/header.jpg
```

No API key, no auth. Main fetches each image once into `%APPDATA%/vr-mod-manager/art/` and serves it
to the renderer over a custom `vrmm-art://<gameId>` scheme, registered as privileged before app-ready.
That keeps artwork working offline after the first fetch and means the renderer never needs a
remote-host exception. A game with no art answers 404 and the renderer draws its own placeholder;
failures are remembered in-process so a dead URL is not retried on every render.

Newer Steam apps keep their header under a content-hashed folder, so the fixed path above 404s for
them (Resident Evil Requiem does). On a miss, main asks the store API
(`store.steampowered.com/api/appdetails?appids=<appid>&filters=basic`) for the current
`header_image` and fetches that instead. The hash changes when the art does, so it is looked up, never
pinned in the catalog.

Games that are not on Steam set `artUrl` to the storefront's own public image (MW2 Campaign
Remastered uses its Microsoft Store key art). With neither, the tile gets the placeholder. A missing
image is cosmetic and must never surface as an error.

No artwork ships with the app or lives in the repo — only URLs. Each install pulls the images from
the storefront CDN itself and caches them locally, the same way game launchers display box art.

## On-disk state

Everything lives under `%APPDATA%/vr-mod-manager/`:

| Path | Contents | Safe to delete? |
|---|---|---|
| `state.json` | detected games, install records, identified builds | No — loses install manifests and backups become orphaned |
| `backups/<modId>/` | files an install displaced | No — needed for a clean uninstall |
| `cache/` | downloaded mod archives | Yes, costs a re-download |
| `art/` | cached game headers | Yes, costs a re-fetch |

`state.json` shape (`AppState` in `src/shared/types.ts`):

```jsonc
{
  "games":      { "<gameId>": { "gameId", "root", "store", "manual" } },
  "installed":  { "<modId>":  { "modId", "gameId", "gameRoot", "version",
                                "installedAt", "files": [{ "path", "backup?" }],
                                "createdDirs": [], "options": [] } },
  "identified": { "<modId>":  { "version", "signature", "checkedAt" } }
}
```

Two rules it holds to:

- **Reads never throw.** A missing or half-written `state.json` must leave a working app that
  re-detects games, not a crash on launch with no recovery short of deleting the file by hand. Every
  field is re-validated as a record; anything unexpected becomes `{}`. `identified` is absent in files
  written before build identification existed, which is exactly why.
- **Writes go through a temp file and a rename.** Writing in place would leave truncated,
  unparseable JSON if the process died mid-write. Rename is atomic, so a reader sees either the old
  file or the complete new one.

## Where the trust boundaries are

| Boundary | What is distrusted | Guard |
|---|---|---|
| renderer → main | every argument | `asString`, `asInstallRequest`, id lookups against the catalog |
| renderer → shell | URLs | main builds `steam://` itself; `openExternal` refuses non-web schemes |
| archive → disk | entry names | full-manifest traversal check before any write, both formats |
| catalog → disk | `to` paths | `resolveInside()` per step |
| network → disk | response bodies | streamed to `.part`, renamed on clean close |
| upstream release → delete | file contents | hash-match against the release before removing an unmanaged file |
