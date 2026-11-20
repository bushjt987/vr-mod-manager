import type { Maturity, ModDef, ModStatus, Progress, StoreKind } from '../../../shared/types'

/** Shared vocabulary for the renderer. Pure functions only -- no IPC in here. */

export type FilterMode = 'all' | 'installed' | 'updates'

export type BusyKind = 'install' | 'update' | 'uninstall'

/** The one derived value every card hangs off. */
export type ModState = 'no-game' | 'not-installed' | 'unmanaged' | 'installed' | 'update'

export interface ModActions {
  install(status: ModStatus): void
  installFromArchive(status: ModStatus): void
  update(status: ModStatus): void
  uninstall(status: ModStatus): void
  toggleOption(status: ModStatus, optionId: string, enabled: boolean): void
  /** Checksum a hand-installed mod against the newest release. */
  identify(status: ModStatus): void
  chooseArchive(modId: string): void
  setManualOpen(modId: string, open: boolean): void
  locateGame(gameId: string): void
  /** Ask Steam to install the game itself. */
  installGame(gameId: string): void
  /** Start the game, through a present mod's launcher where it has one. */
  launchGame(gameId: string): void
  rescan(): void
  openExternal(url: string): void
  openFolder(target: string): void
}

export function modState(status: ModStatus): ModState {
  if (!status.detected) return 'no-game'
  // Files are there but we did not put them there, so we know it is present
  // and nothing more -- no version, and no backups to restore on removal.
  if (!status.installed) return status.presentUnmanaged ? 'unmanaged' : 'not-installed'
  if (status.latest && status.latest.version !== status.installed.version) return 'update'
  return 'installed'
}

/** A mod with no install steps and no installer is documentation, not a payload. */
export function isGuideOnly(mod: ModDef): boolean {
  return mod.install.steps.length === 0 && !mod.install.installer
}

export const MATURITY_LABEL: Record<Maturity, string> = {
  stable: 'Stable',
  beta: 'Beta',
  alpha: 'Alpha',
  experimental: 'Experimental',
}

export const MATURITY_HINT: Record<Maturity, string> = {
  stable: 'Released and broadly reliable.',
  beta: 'Works, with rough edges.',
  alpha: 'Caution: early build, expect bugs.',
  experimental: 'Caution: rolling builds, expect breakage.',
}

export function isCaution(maturity: Maturity): boolean {
  return maturity === 'alpha' || maturity === 'experimental'
}

export const STORE_LABEL: Record<StoreKind, string> = {
  steam: 'Steam',
  xbox: 'Xbox / Game Pass',
  gog: 'GOG',
  epic: 'Epic',
  rockstar: 'Rockstar',
  retail: 'Retail',
  standalone: 'Standalone',
}

export function stateLabel(status: ModStatus): string {
  switch (modState(status)) {
    case 'no-game':
      return 'Game not found'
    case 'not-installed':
      return 'Not installed'
    case 'unmanaged':
      return unmanagedLabel(status.mod, status.detectedVersion)
    case 'installed':
      return status.installed
        ? `Installed ${formatVersion(status.installed.version)}`
        : 'Installed'
    case 'update':
      return 'Update available'
  }
}

/**
 * State text for a mod on disk that this app has no install record for. A mod
 * placed by its own installer always lands here, so "manually" would be wrong
 * for those.
 */
export function unmanagedLabel(mod: ModDef, version: string | undefined): string {
  if (mod.install.installer) {
    return version ? `Installed by its setup · ${formatVersion(version)}` : 'Installed by its setup'
  }
  return version
    ? `Installed manually · ${formatVersion(version)}`
    : 'Installed manually (version unknown)'
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0.0 MB'
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Keep both ends of a long Windows path readable. */
export function elideMiddle(text: string, max = 54): string {
  if (text.length <= max) return text
  const keep = max - 3
  const head = Math.ceil(keep * 0.55)
  const tail = keep - head
  return `${text.slice(0, head)}...${text.slice(text.length - tail)}`
}

export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (typeof err === 'string' && err.trim()) return err
  return 'Something went wrong talking to the app shell.'
}

export function defaultOptionIds(mod: ModDef): string[] {
  return (mod.options ?? []).filter((option) => option.default).map((option) => option.id)
}

/** null means "we cannot show a real percentage" -> indeterminate bar. */
export function progressPercent(progress: Progress): number | null {
  if (progress.phase !== 'downloading') return null
  if (!Number.isFinite(progress.total) || progress.total <= 0) return null
  const pct = (progress.received / progress.total) * 100
  return Math.max(0, Math.min(100, pct))
}

export function progressLabel(progress: Progress): string {
  switch (progress.phase) {
    case 'resolving':
      return 'Resolving the latest release'
    case 'downloading':
      return `Downloading ${formatBytes(progress.received)} of ${formatBytes(progress.total)}`
    case 'extracting':
      return 'Extracting archive'
    case 'copying':
      return `Copying ${progress.file}`
    case 'waiting':
      return `${progress.program} is open - finish there, then close it`
    case 'done':
      return 'Finished'
    case 'error':
      return progress.message
  }
}

/** Install timestamps come from the main process; never trust them to parse. */
export function formatDate(iso: string): string | null {
  const stamp = Date.parse(iso)
  if (Number.isNaN(stamp)) return null
  return new Date(stamp).toLocaleDateString()
}

/**
 * Render a version for display.
 *
 * Versions arrive from two places: a GitHub tag, which usually already carries
 * a leading "v", and a manual download, where the "version" is the filename the
 * user picked. Prefixing blindly produced "vv0.8.3", so only bare numeric
 * versions get a "v" and anything else is left exactly as it is.
 */
export function formatVersion(version: string): string {
  if (/^v\d/i.test(version)) return version
  if (/^\d/.test(version)) return `v${version}`
  return version
}

/**
 * Is a manually installed build behind the newest release?
 *
 * Only answerable when the mod records a version that lines up with its release
 * tags. A commit SHA pins the build exactly but says nothing about which
 * release it belongs to, so those return undefined rather than a guess.
 */
export function unmanagedIsCurrent(status: ModStatus): boolean | undefined {
  if (!status.detectedVersionComparable) return undefined
  const installed = status.detectedVersion
  const latest = status.latest?.version
  if (!installed || !latest) return undefined

  // Normalise "v1.0.0-beta.8" against "1.0.0-beta.8+cbf724e": drop a leading v
  // and any build metadata after '+'.
  const normalise = (value: string): string =>
    value.trim().replace(/^v/i, '').split('+')[0].toLowerCase()

  return normalise(installed) === normalise(latest)
}

/**
 * Does this mod have a newer release than what is on disk?
 *
 * Two cases, and forgetting the second is a bug this app has now made three
 * times: a managed install whose recorded version is behind, and a
 * hand-installed one whose build we identified and which turned out to be
 * behind. Anything that filters, counts or labels updates must use this rather
 * than testing `modState === 'update'` on its own.
 */
export function hasUpdate(status: ModStatus): boolean {
  if (modState(status) === 'update') return true
  return modState(status) === 'unmanaged' && unmanagedIsCurrent(status) === false
}

/** Is this mod's payload on disk, however it got there? */
export function isPresent(status: ModStatus): boolean {
  const state = modState(status)
  return state === 'installed' || state === 'update' || state === 'unmanaged'
}

/**
 * The installed mod that rules this one out, if any.
 *
 * Conflicts are declared per mod rather than inferred from sharing a game:
 * several mods in this catalog are layered on top of each other and must stay
 * installable together.
 */
export function blockingConflict(
  status: ModStatus,
  siblings: ModStatus[],
): ModStatus | undefined {
  const conflicts = status.mod.conflictsWith
  if (!conflicts || conflicts.length === 0) return undefined
  return siblings.find(
    (other) => other.mod.id !== status.mod.id && conflicts.includes(other.mod.id) && isPresent(other),
  )
}

/**
 * Names of the mods this one needs that are not installed.
 *
 * Resolved against every status, not just the ones for the same game: UEVR is
 * its own standalone entry, and REFramework sits under a different game than
 * the addons that build on it.
 */
export function missingRequirements(status: ModStatus, all: ModStatus[]): string[] {
  const needed = status.mod.requires
  if (!needed || needed.length === 0) return []

  const present = new Set(all.filter(isPresent).map((other) => other.mod.id))
  return needed
    .filter((id) => !present.has(id))
    .map((id) => all.find((other) => other.mod.id === id)?.mod.name ?? id)
}
