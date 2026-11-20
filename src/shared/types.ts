/** Shared types for the mod catalog, game detection, and install state. */

export type StoreKind = 'steam' | 'xbox' | 'gog' | 'epic' | 'rockstar' | 'retail' | 'standalone'

export interface GameDef {
  id: string
  name: string
  /** Steam appid, used to resolve the install dir from libraryfolders.vdf. */
  steamAppId?: number
  /** Folder names to probe for under <drive>:\XboxGames and friends. */
  xboxFolderNames?: string[]
  /** `reg query`-style lookups: [key, valueName]. */
  registryProbes?: { key: string; value: string }[]
  /**
   * Relative paths where AT LEAST ONE must exist under a candidate root for it
   * to count as a real install. Guards against pointing the installer at a
   * random folder. Prefer stable directory markers over exe names, which vary
   * between storefronts and game revisions.
   */
  verifyPaths: string[]
  /**
   * Standalone games (PC ports like Ship of Harkinian) have no pre-existing
   * install dir -- the user picks an empty folder to install into.
   */
  standalone?: boolean
  /**
   * Override the header artwork. Games with a `steamAppId` get theirs from the
   * Steam CDN automatically, so this is only for the ones that were never on
   * Steam. Leave it unset and the UI draws a generated placeholder instead.
   */
  artUrl?: string
  stores: StoreKind[]
}

/** Where the mod's files come from. */
export type SourceDef =
  | {
      kind: 'github'
      /** "owner/repo" */
      repo: string
      /** JS regex matched against the release asset filename. */
      assetPattern: string
      /** Most VR mods ship only prereleases; opt in per mod. */
      allowPrerelease?: boolean
      /** Pin to a tag instead of tracking the newest release. */
      tag?: string
      /**
       * JS regex matched against release tags. Only matching releases are
       * considered, for projects that publish two lines side by side (nightly
       * builds beside the recommended releases).
       */
      tagPattern?: string
    }
  | {
      kind: 'direct'
      /**
       * A link the author keeps pointed at the newest build, usually by
       * redirecting to a versioned filename. Only the newest build is ever
       * reachable, so there is no release history behind it.
       */
      url: string
      /**
       * JS regex with ONE capture group, matched against the filename the link
       * finally lands on. The capture is the version.
       */
      versionPattern: string
    }
  | {
      kind: 'manual'
      /** Page the user downloads from (Nexus, itch, forum thread). */
      url: string
      /** Shown in the UI above the "choose downloaded file" button. */
      instructions: string
      /** Sanity-check the file the user picks. */
      filePattern?: string
    }

export interface InstallStep {
  /**
   * Path inside the extracted archive. `**` means "everything".
   * A trailing `/**` copies a directory's contents.
   */
  from: string
  /** Destination relative to the game root. `.` is the root itself. */
  to: string
  /** Skip silently when `from` matches nothing. */
  optional?: boolean
  /** Only run when this option id is enabled. */
  when?: string
}

export interface InstallOption {
  id: string
  label: string
  description: string
  default: boolean
}

/**
 * A release that is an installer rather than files to copy.
 *
 * Some mods cannot be installed by copying: Max Payne 2 VR's Setup builds
 * assets from the user's own game files. For those the manager downloads and
 * unpacks the release, starts the author's installer, and waits for it to
 * close. The installer owns placing, updating and removing the mod, so the
 * manager keeps no file record and finds the result through `fingerprint` and
 * `versionFrom` like any install it did not perform.
 */
export interface InstallerDef {
  /**
   * The program to start, relative to the extracted archive. Omit when the
   * release asset is the installer itself (a bare Setup .exe), which is then
   * run as downloaded.
   */
  run?: string
  /**
   * The copy of the installer the mod leaves in the game folder, relative to
   * the game root. Uninstall reopens it; without one, Uninstall downloads the
   * newest release and opens its installer instead.
   */
  uninstall?: string
  /** What to do once the installer opens. Shown on the card. */
  instructions: string
}

export interface InstallPlan {
  /**
   * Drop a single top-level wrapper directory from the archive before
   * resolving steps (GitHub zips usually have one).
   */
  stripRootDir?: boolean
  steps: InstallStep[]
  /** Hand the release to the mod's own installer. `steps` must be empty. */
  installer?: InstallerDef
}

/**
 * How to read a mod's version off the disk.
 *
 * Mod DLLs almost never fill in their PE version resource -- every mod in this
 * catalog leaves it blank -- so the only reliable source is a metadata file the
 * mod ships alongside its payload. Not every mod ships one.
 */
export type VersionSource = {
  /** Relative to the game root. */
  path: string
  /**
   * JSON field to read. Omit to treat the file as plain text, in which case
   * `pattern` applies (or the whole trimmed file is the version).
   */
  field?: string
  /** Regex with one capture group, applied to a text file. */
  pattern?: string
  /**
   * True when the value lines up with the release tag, so an installed build
   * can be compared against the newest release. False for opaque values such
   * as a bare commit SHA, which can be displayed but not compared.
   */
  matchesReleaseTag?: boolean
}

export type Maturity = 'stable' | 'beta' | 'alpha' | 'experimental'

export interface ModDef {
  id: string
  name: string
  gameId: string
  author: string
  homepage: string
  summary: string
  kind: 'vr-mod' | 'pc-port'
  maturity: Maturity
  source: SourceDef
  install: InstallPlan
  /**
   * Relative paths that prove this mod is already present in a game folder,
   * used to spot installs this manager did not perform.
   *
   * Derived automatically from named copy steps when omitted. A mod whose plan
   * only has a wildcard step has no derivable signature, so it needs one here
   * or it cannot be detected on disk.
   */
  fingerprint?: string[]
  /** Where to read the installed version from, for mods that record one. */
  versionFrom?: VersionSource
  /**
   * Storefronts this mod actually works with, when it is fussier than the game
   * is. Several mods verify the exact executable and reject other editions, so
   * listing one copy of a game is not enough to know a mod applies to it.
   */
  requiresStore?: StoreKind[]
  /**
   * Mod ids that cannot be installed alongside this one.
   *
   * Sharing a game is NOT enough to conflict: GRAND-MotherVR is layered on top
   * of MotherVR and RE4VR on top of REFramework, so those must stay installable
   * together. Only genuinely competing implementations belong here.
   */
  conflictsWith?: string[]
  /**
   * Mod ids this one needs installed first.
   *
   * Several entries are profiles or plugins for a separate injector -- UEVR,
   * REFramework, MotherVR -- and are useless without it. The dependency can
   * belong to a different game entry (UEVR is a standalone tool), so this is
   * resolved across the whole catalog rather than within one game.
   */
  requires?: string[]
  /**
   * What to run instead of the game while this mod is present, relative to
   * the game root -- an .exe, .bat or .cmd the mod itself ships. Only for mods
   * that are inactive unless started this way (an injector's launcher, a
   * wrapper script); mods that hook the game's own executable leave it unset
   * so the game starts normally.
   */
  launch?: string
  options?: InstallOption[]
  requirements: string[]
  notes?: string[]
}

/* ---------- runtime state ---------- */

export interface DetectedGame {
  gameId: string
  root: string
  store: StoreKind
  /** true when the user picked the path by hand rather than auto-detection. */
  manual: boolean
}

/** One file this manager wrote, so uninstall can reverse it exactly. */
export interface WrittenFile {
  /** Relative to the game root. */
  path: string
  /** Sidecar holding the file we displaced, if any. */
  backup?: string
}

export interface InstalledMod {
  modId: string
  gameId: string
  gameRoot: string
  version: string
  installedAt: string
  files: WrittenFile[]
  /** Directories we created, deepest first, removed on uninstall if empty. */
  createdDirs: string[]
  options: string[]
}

/**
 * A hand-installed mod whose build we worked out by checksum.
 *
 * Identifying one costs a download per release inspected, so the answer is kept
 * rather than recomputed every launch. `signature` is a hash of the mod's own
 * files at the time: if the user later replaces them by hand it stops matching
 * and the record is discarded, which costs one cheap local hash to check and
 * needs no network.
 *
 * Deliberately no "is this the latest" flag -- that would go stale the moment
 * upstream publishes. It is derived by comparing `version` to the current
 * release whenever it is needed.
 */
export interface IdentifiedBuild {
  version: string
  signature: string
  checkedAt: string
}

export interface AppState {
  games: Record<string, DetectedGame>
  installed: Record<string, InstalledMod>
  /** Keyed by mod id. */
  identified: Record<string, IdentifiedBuild>
}

/* ---------- ipc payloads ---------- */

export interface ResolvedRelease {
  version: string
  /** The release's own headline, e.g. "v0.8.3 - hotfix: left-eye flicker". */
  title?: string
  /** Release notes as plain text. Only surfaced when an update is available. */
  notes?: string
  assetName: string
  downloadUrl: string
  size: number
  publishedAt: string
  htmlUrl: string
}

export interface ModStatus {
  mod: ModDef
  game: GameDef
  detected?: DetectedGame
  installed?: InstalledMod
  latest?: ResolvedRelease
  /** Set when the latest lookup failed (offline, rate limit, repo gone). */
  latestError?: string
  /**
   * The mod's files are in the game folder but this manager has no install
   * record for them -- installed by hand, or by an older copy of the app.
   * We know it is there; we do not know its version, and we hold no backups
   * for it, so it cannot be cleanly uninstalled from here.
   */
  presentUnmanaged?: boolean
  /**
   * Version read off the disk for a mod we did not install. Only set when the
   * mod ships a metadata file naming its build.
   */
  detectedVersion?: string
  /**
   * Whether `detectedVersion` can be compared with `latest.version`. A commit
   * SHA identifies a build precisely but says nothing about which release it is.
   */
  detectedVersionComparable?: boolean
}

export type Progress =
  | { phase: 'resolving' }
  | { phase: 'downloading'; received: number; total: number }
  | { phase: 'extracting' }
  | { phase: 'copying'; file: string }
  /** A mod's own installer is open; the manager is waiting for it to close. */
  | { phase: 'waiting'; program: string }
  | { phase: 'done' }
  | { phase: 'error'; message: string }
