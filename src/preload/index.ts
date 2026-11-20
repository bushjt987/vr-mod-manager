import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/api'
import type {
  AppUpdateStatus,
  IdentifyOutcome,
  InstallRequest,
  ProgressEvent,
  Result,
  VrmmApi,
} from '@shared/api'
import type { DetectedGame, ModStatus, ResolvedRelease } from '@shared/types'
import type { IpcRendererEvent } from 'electron'

/**
 * `ipcRenderer.invoke` is typed as `Promise<any>`. Funnelling every call through
 * one place keeps that single unchecked cast out of the API surface below, so
 * the exposed object is fully typed against the shared contract.
 */
function invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>
}

const api: VrmmApi = {
  listStatuses: () => invoke<ModStatus[]>(IPC.listStatuses),
  detectGames: () => invoke<DetectedGame[]>(IPC.detectGames),
  refreshLatest: (modId: string) => invoke<Result<ResolvedRelease>>(IPC.refreshLatest, modId),
  setGamePath: (gameId: string, root: string) =>
    invoke<Result<DetectedGame>>(IPC.setGamePath, gameId, root),
  browseForGame: (gameId: string) =>
    invoke<Result<DetectedGame> | undefined>(IPC.browseForGame, gameId),
  browseForArchive: (modId: string) => invoke<string | undefined>(IPC.browseForArchive, modId),

  identify: (modId: string) => invoke<Result<IdentifyOutcome>>(IPC.identify, modId),
  install: (request: InstallRequest) => invoke<Result<null>>(IPC.install, request),
  uninstall: (modId: string) => invoke<Result<null>>(IPC.uninstall, modId),

  openGameStore: (gameId: string) => invoke<Result<null>>(IPC.openGameStore, gameId),
  launchGame: (gameId: string) => invoke<Result<null>>(IPC.launchGame, gameId),
  openExternal: (url: string) => invoke<void>(IPC.openExternal, url),
  openFolder: (target: string) => invoke<void>(IPC.openFolder, target),

  onProgress: (handler: (event: ProgressEvent) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, payload: ProgressEvent): void => {
      handler(payload)
    }
    ipcRenderer.on(IPC.progress, listener)
    // React effects unmount constantly; without this the main process would
    // accumulate listeners for the life of the app.
    return () => {
      ipcRenderer.removeListener(IPC.progress, listener)
    }
  },

  getUpdateStatus: () => invoke<AppUpdateStatus>(IPC.getUpdateStatus),
  checkForAppUpdate: () => invoke<void>(IPC.checkForAppUpdate),
  installAppUpdate: () => invoke<void>(IPC.installAppUpdate),
  onUpdateStatus: (handler: (status: AppUpdateStatus) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, payload: AppUpdateStatus): void => {
      handler(payload)
    }
    ipcRenderer.on(IPC.updateStatus, listener)
    return () => {
      ipcRenderer.removeListener(IPC.updateStatus, listener)
    }
  },
}

// Only the API crosses the bridge. `ipcRenderer` itself never does: handing it
// over would let any renderer-side script talk to every channel in the app.
contextBridge.exposeInMainWorld('vrmm', api)
