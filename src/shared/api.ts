import type { DetectedGame, ModStatus, Progress, ResolvedRelease } from './types'

/**
 * The single contract between the renderer and the main process.
 *
 * The preload script exposes exactly this object as `window.vrmm`, the main
 * process registers one ipcMain handler per method, and the renderer never
 * touches Electron or Node APIs directly.
 */

export const IPC = {
  listStatuses: 'vrmm:listStatuses',
  detectGames: 'vrmm:detectGames',
  refreshLatest: 'vrmm:refreshLatest',
  setGamePath: 'vrmm:setGamePath',
  browseForGame: 'vrmm:browseForGame',
  browseForArchive: 'vrmm:browseForArchive',
  identify: 'vrmm:identify',
  install: 'vrmm:install',
  uninstall: 'vrmm:uninstall',
  openGameStore: 'vrmm:openGameStore',
  launchGame: 'vrmm:launchGame',
  openExternal: 'vrmm:openExternal',
  openFolder: 'vrmm:openFolder',
  progress: 'vrmm:progress',
  getUpdateStatus: 'vrmm:getUpdateStatus',
  checkForAppUpdate: 'vrmm:checkForAppUpdate',
  installAppUpdate: 'vrmm:installAppUpdate',
  updateStatus: 'vrmm:updateStatus',
} as const

/**
 * Where the app's own self-update stands. Mod updates are a separate thing
 * (ModStatus); this is only about VR Mod Manager itself.
 *
 * `unsupported` covers dev runs and the unpacked build, which have no
 * installer for electron-updater to hand off to.
 */
export type AppUpdateStatus =
  | { state: 'unsupported' }
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'current'; version: string }
  | { state: 'downloading'; version: string; percent: number }
  | { state: 'ready'; version: string }
  | { state: 'error'; message: string }

export interface InstallRequest {
  modId: string
  /** Enabled InstallOption ids. */
  options: string[]
  /**
   * For `manual` sources: the archive the user already downloaded.
   * Ignored for `github` sources.
   */
  archivePath?: string
}

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

/**
 * Outcome of checksumming a hand-installed mod against release history.
 *
 * `identified` names the exact build. `unrecognised` means it matched none of
 * the releases searched -- either older than that window, or edited.
 */
export type IdentifyOutcome =
  | { kind: 'identified'; version: string; isLatest: boolean; latestVersion: string }
  | { kind: 'unrecognised'; latestVersion: string; searched: number }
  | { kind: 'unknown'; reason: string }

/** Progress events are broadcast with the mod they belong to. */
export interface ProgressEvent {
  modId: string
  progress: Progress
}

export interface VrmmApi {
  /** Catalog joined with detection + install state. The renderer's main read. */
  listStatuses(): Promise<ModStatus[]>
  /** Re-run game auto-detection across Steam, Xbox and the registry. */
  detectGames(): Promise<DetectedGame[]>
  /** Hit the source (GitHub) for the newest release of one mod. */
  refreshLatest(modId: string): Promise<Result<ResolvedRelease>>
  /** Record a hand-picked game root, validating it against GameDef.verifyPaths. */
  setGamePath(gameId: string, root: string): Promise<Result<DetectedGame>>
  /** Open a folder picker for a game, then validate and record it. */
  browseForGame(gameId: string): Promise<Result<DetectedGame> | undefined>
  /** Open a file picker for a manually downloaded mod archive. */
  browseForArchive(modId: string): Promise<string | undefined>

  /**
   * Checksum a hand-installed mod against the newest release to find out
   * whether it is the current build. Downloads the release, so it is on demand.
   */
  identify(modId: string): Promise<Result<IdentifyOutcome>>

  install(request: InstallRequest): Promise<Result<null>>
  uninstall(modId: string): Promise<Result<null>>

  /**
   * Ask Steam to install a game, by game id rather than URL.
   *
   * The renderer never supplies the steam:// URL: main builds it from the
   * catalog's appid, so the only reachable verbs are the ones this app means
   * to expose.
   */
  openGameStore(gameId: string): Promise<Result<null>>

  /**
   * Start a detected game: through an installed mod's launcher when it has
   * one, else Steam, else the game's own executable (see `launchTargets`).
   * By game id for the same reason as openGameStore -- main picks the file.
   */
  launchGame(gameId: string): Promise<Result<null>>

  openExternal(url: string): Promise<void>
  openFolder(target: string): Promise<void>

  /** Subscribe to install progress. Returns an unsubscribe function. */
  onProgress(handler: (event: ProgressEvent) => void): () => void

  /** The app's own update state, for the first paint before any event arrives. */
  getUpdateStatus(): Promise<AppUpdateStatus>
  /** Ask GitHub for a newer build of the app now. Downloads it if there is one. */
  checkForAppUpdate(): Promise<void>
  /** Quit, run the downloaded installer silently, and relaunch. */
  installAppUpdate(): Promise<void>
  /** Subscribe to app update state changes. Returns an unsubscribe function. */
  onUpdateStatus(handler: (status: AppUpdateStatus) => void): () => void
}

declare global {
  interface Window {
    vrmm: VrmmApi
  }
}
