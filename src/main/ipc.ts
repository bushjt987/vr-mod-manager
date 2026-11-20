import path from 'node:path'
import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type { OpenDialogOptions } from 'electron'
import { IPC } from '@shared/api'
import type {
  AppUpdateStatus,
  IdentifyOutcome,
  InstallRequest,
  ProgressEvent,
  Result,
} from '@shared/api'
import { GAMES_BY_ID, MODS, MODS_BY_ID } from '@shared/catalog'
import type {
  DetectedGame,
  GameDef,
  ModStatus,
  Progress,
  ResolvedRelease,
  StoreKind,
} from '@shared/types'
import { detectAllGames, verifyGameRoot } from './services/detect'
import { identifyBuild } from './services/identify'
import {
  installMod,
  uninstallMod,
  uninstallUnmanaged,
  uninstallWithInstaller,
} from './services/install'
import { isDownloadable, resolveRelease } from './services/release'
import type { DownloadableSource } from './services/release'
import { launchGame } from './services/launch'
import { fingerprintSignature, isModPresent, readInstalledVersion } from './services/presence'
import { loadState, saveState, setGame } from './services/store'
import { checkForAppUpdate, getUpdateStatus, installAppUpdate } from './services/updater'

/** What the installer reports back while it works. */
interface InstallContext {
  onProgress(progress: Progress): void
}

/**
 * GitHub allows 60 anonymous requests an hour per IP, and several catalog
 * entries share a repo -- the BioShock trilogy mod alone backs three of them.
 * Caching per source keeps a full status refresh down to one request per
 * distinct repo, and the in-flight map collapses the concurrent calls that a
 * single listStatuses fires off.
 */
const RELEASE_TTL_MS = 60 * 60 * 1000
const releaseCache = new Map<string, { at: number; release: ResolvedRelease }>()
const releasesInFlight = new Map<string, Promise<ResolvedRelease>>()

function releaseKey(source: DownloadableSource): string {
  if (source.kind === 'direct') return [source.url, source.versionPattern].join('#')
  return [source.repo, source.assetPattern, source.tag ?? '', source.allowPrerelease ? 1 : 0].join('#')
}

async function cachedRelease(source: DownloadableSource, force = false): Promise<ResolvedRelease> {
  const key = releaseKey(source)

  if (!force) {
    const hit = releaseCache.get(key)
    if (hit && Date.now() - hit.at < RELEASE_TTL_MS) return hit.release

    const pending = releasesInFlight.get(key)
    if (pending) return pending
  }

  const request = resolveRelease(source)
    .then((release) => {
      releaseCache.set(key, { at: Date.now(), release })
      return release
    })
    .finally(() => {
      releasesInFlight.delete(key)
    })

  releasesInFlight.set(key, request)
  return request
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unexpected error'
}

/** Run something that may throw and hand the renderer a Result instead. */
async function asResult<T>(run: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, value: await run() }
  } catch (error) {
    return { ok: false, error: messageOf(error) }
  }
}

/**
 * For the handful of channels whose contract is a bare value rather than a
 * Result. An exception must never cross the IPC boundary, so failures degrade
 * to an empty answer.
 */
async function orFallback<T>(fallback: T, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  } catch {
    return fallback
  }
}

function asString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Malformed request: ${name} must be a non-empty string.`)
  }
  return value
}

function asInstallRequest(value: unknown): InstallRequest {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Malformed request: expected an install request object.')
  }
  const candidate = value as Record<string, unknown>
  const modId = asString(candidate['modId'], 'modId')

  const rawOptions = candidate['options']
  if (!Array.isArray(rawOptions) || rawOptions.some((option) => typeof option !== 'string')) {
    throw new Error('Malformed request: options must be an array of strings.')
  }

  const rawArchive = candidate['archivePath']
  if (rawArchive !== undefined && typeof rawArchive !== 'string') {
    throw new Error('Malformed request: archivePath must be a string when present.')
  }

  const request: InstallRequest = { modId, options: rawOptions as string[] }
  if (typeof rawArchive === 'string' && rawArchive.length > 0) request.archivePath = rawArchive
  return request
}

/**
 * A hand-picked folder carries no storefront information, so label it with the
 * game's primary store rather than inventing one.
 */
function storeForManualPick(game: GameDef): StoreKind {
  if (game.standalone === true) return 'standalone'
  return game.stores[0] ?? 'retail'
}

function lookupGame(gameId: string): GameDef {
  const game = GAMES_BY_ID.get(gameId)
  if (!game) throw new Error(`Unknown game: ${gameId}`)
  return game
}

export function registerIpc(getWindow: () => BrowserWindow | null): void {
  function broadcast(event: ProgressEvent): void {
    const window = getWindow()
    if (!window || window.isDestroyed()) return
    window.webContents.send(IPC.progress, event)
  }

  function contextFor(modId: string): InstallContext {
    return {
      onProgress(progress: Progress): void {
        broadcast({ modId, progress })
      },
    }
  }

  async function openDialogFor(options: OpenDialogOptions): Promise<string | undefined> {
    const window = getWindow()
    const result =
      window && !window.isDestroyed()
        ? await dialog.showOpenDialog(window, options)
        : await dialog.showOpenDialog(options)
    if (result.canceled) return undefined
    return result.filePaths[0]
  }

  /** Validate a candidate game root and remember it. Shared by two channels. */
  async function recordGamePath(gameId: string, root: string): Promise<DetectedGame> {
    const game = lookupGame(gameId)
    const normalized = path.normalize(root)

    if (!(await verifyGameRoot(game, normalized))) {
      const expected =
        game.verifyPaths.length > 0
          ? ` Expected to find one of: ${game.verifyPaths.join(', ')}.`
          : ''
      throw new Error(`That folder does not look like ${game.name}.${expected}`)
    }

    const detected: DetectedGame = {
      gameId: game.id,
      root: normalized,
      store: storeForManualPick(game),
      manual: true,
    }
    await saveState(setGame(await loadState(), detected))
    return detected
  }

  /* ---------------- read ---------------- */

  ipcMain.handle(IPC.listStatuses, async (): Promise<ModStatus[]> =>
    orFallback<ModStatus[]>([], async () => {
      const state = await loadState()
      const statuses: ModStatus[] = []

      for (const mod of MODS) {
        const game = GAMES_BY_ID.get(mod.gameId)
        // A mod whose game left the catalog has nothing to install into.
        if (!game) continue

        const status: ModStatus = { mod, game }
        const detected = state.games[mod.gameId]
        if (detected) status.detected = detected
        const installed = state.installed[mod.id]
        if (installed) status.installed = installed
        statuses.push(status)
      }

      // Look for mods already sitting in the game folder that we have no record
      // of -- installed by hand, or before this manager existed. Only worth
      // asking when the game was found and we did not install the mod
      // ourselves.
      await Promise.all(
        statuses.map(async (status) => {
          if (status.installed || !status.detected) return
          try {
            if (await isModPresent(status.mod, status.detected.root)) {
              status.presentUnmanaged = true
              const version = await readInstalledVersion(status.mod, status.detected.root)
              if (version) {
                status.detectedVersion = version
                status.detectedVersionComparable = status.mod.versionFrom?.matchesReleaseTag === true
              } else {
                // Fall back to a build identified by checksum on an earlier run.
                // The stored signature is re-checked against the files on disk,
                // so a mod replaced by hand since then is not reported stale.
                const remembered = state.identified[status.mod.id]
                if (remembered) {
                  const signature = await fingerprintSignature(status.mod, status.detected.root)
                  if (signature === remembered.signature) {
                    status.detectedVersion = remembered.version
                    status.detectedVersionComparable = true
                  }
                }
              }
            }
          } catch {
            // An unreadable game folder is not worth failing the list over.
          }
        }),
      )

      // Resolve the newest release for every downloadable mod in parallel.
      // Without this the renderer can never tell "installed" from "outdated".
      // A lookup failure is per-mod data, not a reason to fail the whole list.
      await Promise.all(
        statuses.map(async (status) => {
          const source = status.mod.source
          if (!isDownloadable(source)) return
          try {
            status.latest = await cachedRelease(source)
          } catch (error) {
            status.latestError = messageOf(error)
          }
        }),
      )

      return statuses
    }),
  )

  ipcMain.handle(IPC.detectGames, async (): Promise<DetectedGame[]> =>
    orFallback<DetectedGame[]>([], async () => {
      const found = await detectAllGames()

      let state = await loadState()
      for (const game of found) {
        // Never clobber a path the user chose by hand with a guess.
        const existing = state.games[game.gameId]
        if (existing && existing.manual) continue
        state = setGame(state, game)
      }
      await saveState(state)

      return found
    }),
  )

  ipcMain.handle(
    IPC.refreshLatest,
    async (_event, rawModId: unknown): Promise<Result<ResolvedRelease>> =>
      asResult(async () => {
        const modId = asString(rawModId, 'modId')
        const mod = MODS_BY_ID.get(modId)
        if (!mod) throw new Error(`Unknown mod: ${modId}`)
        if (!isDownloadable(mod.source)) {
          throw new Error(`${mod.name} is downloaded by hand, so there is no release to check.`)
        }
        // An explicit check bypasses the cache; that is the point of the button.
        return cachedRelease(mod.source, true)
      }),
  )

  /* ---------------- game paths ---------------- */

  ipcMain.handle(
    IPC.setGamePath,
    async (_event, rawGameId: unknown, rawRoot: unknown): Promise<Result<DetectedGame>> =>
      asResult(async () => {
        const gameId = asString(rawGameId, 'gameId')
        const root = asString(rawRoot, 'root')
        return recordGamePath(gameId, root)
      }),
  )

  ipcMain.handle(
    IPC.browseForGame,
    async (_event, rawGameId: unknown): Promise<Result<DetectedGame> | undefined> => {
      try {
        const gameId = asString(rawGameId, 'gameId')
        const game = lookupGame(gameId)

        const picked = await openDialogFor({
          title: `Select the ${game.name} folder`,
          properties: ['openDirectory'],
        })
        // Cancelling is not a failure -- the contract says "undefined".
        if (picked === undefined) return undefined

        return await asResult(() => recordGamePath(gameId, picked))
      } catch (error) {
        return { ok: false, error: messageOf(error) }
      }
    },
  )

  ipcMain.handle(
    IPC.browseForArchive,
    async (_event, rawModId: unknown): Promise<string | undefined> =>
      orFallback<string | undefined>(undefined, async () => {
        const modId = asString(rawModId, 'modId')
        const mod = MODS_BY_ID.get(modId)
        return openDialogFor({
          title: mod ? `Select the downloaded ${mod.name} archive` : 'Select the mod archive',
          properties: ['openFile'],
          filters: [
            { name: 'Mod archives', extensions: ['zip', '7z'] },
            { name: 'All files', extensions: ['*'] },
          ],
        })
      }),
  )

  ipcMain.handle(
    IPC.identify,
    async (_event, rawModId: unknown): Promise<Result<IdentifyOutcome>> =>
      asResult(async () => {
        const modId = asString(rawModId, 'modId')
        const mod = MODS_BY_ID.get(modId)
        if (!mod) throw new Error(`Unknown mod: ${modId}`)

        const state = await loadState()
        const detected = state.games[mod.gameId]
        if (!detected) throw new Error(`${mod.name} has no game folder to check.`)

        const context = contextFor(modId)
        try {
          return await identifyBuild(mod, detected.root, context)
        } finally {
          // The bar is driven by the same progress stream installs use, so it
          // has to be cleared however this ends.
          context.onProgress({ phase: 'done' })
        }
      }),
  )

  /**
   * Hand a game off to Steam to install.
   *
   * The renderer passes a game id, never a URL. steam:// has verbs well beyond
   * installing, so the URL is built here from the catalog's appid and nothing
   * the renderer sends can widen that.
   */
  ipcMain.handle(
    IPC.openGameStore,
    async (_event, rawGameId: unknown): Promise<Result<null>> =>
      asResult(async () => {
        const game = lookupGame(asString(rawGameId, 'gameId'))
        const appId = game.steamAppId
        if (appId === undefined || !Number.isInteger(appId) || appId <= 0) {
          throw new Error(`${game.name} is not a Steam game, so Steam cannot install it.`)
        }
        await shell.openExternal(`steam://install/${appId}`)
        return null
      }),
  )

  ipcMain.handle(
    IPC.launchGame,
    async (_event, rawGameId: unknown): Promise<Result<null>> =>
      asResult(async () => {
        const game = lookupGame(asString(rawGameId, 'gameId'))
        const detected = (await loadState()).games[game.id]
        if (!detected) throw new Error(`${game.name} was not found on this PC.`)
        await launchGame(game, detected)
        return null
      }),
  )

  /* ---------------- install ---------------- */

  ipcMain.handle(IPC.install, async (_event, rawRequest: unknown): Promise<Result<null>> => {
    let context: InstallContext | undefined
    try {
      const request = asInstallRequest(rawRequest)
      context = contextFor(request.modId)
      await installMod(request, context)
      context.onProgress({ phase: 'done' })
      return { ok: true, value: null }
    } catch (error) {
      const message = messageOf(error)
      // A malformed request never got a context, so there is nobody to tell.
      context?.onProgress({ phase: 'error', message })
      return { ok: false, error: message }
    }
  })

  ipcMain.handle(IPC.uninstall, async (_event, rawModId: unknown): Promise<Result<null>> => {
    let context: InstallContext | undefined
    try {
      const modId = asString(rawModId, 'modId')
      context = contextFor(modId)

      // A mod placed by its own installer is removed by that installer. With no
      // install record there is nothing to reverse, but a mod we have
      // identified can still be removed by deleting only the files that still
      // hash-match that release.
      const mod = MODS_BY_ID.get(modId)
      const state = await loadState()
      if (mod?.install.installer) {
        await uninstallWithInstaller(mod, context)
      } else if (state.installed[modId]) {
        await uninstallMod(modId, context)
      } else {
        const remembered = state.identified[modId]
        if (!remembered) {
          throw new Error('This mod has to be identified before it can be removed from here.')
        }
        await uninstallUnmanaged(modId, remembered.version, context)
      }
      context.onProgress({ phase: 'done' })
      return { ok: true, value: null }
    } catch (error) {
      const message = messageOf(error)
      context?.onProgress({ phase: 'error', message })
      return { ok: false, error: message }
    }
  })

  /* ---------------- shell ---------------- */

  ipcMain.handle(IPC.openExternal, async (_event, rawUrl: unknown): Promise<void> => {
    await orFallback<void>(undefined, async () => {
      const url = asString(rawUrl, 'url')
      // Never hand the OS a file:// or custom-scheme URL from the renderer.
      const protocol = new URL(url).protocol
      if (protocol !== 'https:' && protocol !== 'http:') {
        throw new Error(`Refusing to open a non-web URL: ${url}`)
      }
      await shell.openExternal(url)
    })
  })

  ipcMain.handle(IPC.openFolder, async (_event, rawTarget: unknown): Promise<void> => {
    await orFallback<void>(undefined, async () => {
      const target = asString(rawTarget, 'target')
      await shell.openPath(path.normalize(target))
    })
  })

  ipcMain.handle(IPC.getUpdateStatus, (): AppUpdateStatus => getUpdateStatus())
  ipcMain.handle(IPC.checkForAppUpdate, async (): Promise<void> => {
    await checkForAppUpdate()
  })
  ipcMain.handle(IPC.installAppUpdate, (): void => {
    installAppUpdate()
  })
}
