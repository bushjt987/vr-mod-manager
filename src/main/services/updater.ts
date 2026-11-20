import { app } from 'electron'
import type { BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import type { AppUpdater } from 'electron-updater'
import { IPC } from '@shared/api'
import type { AppUpdateStatus } from '@shared/api'

/**
 * Self-update for the app itself, from the GitHub releases named in
 * package.json's `build.publish`. electron-builder writes that into
 * app-update.yml at package time, so nothing here names the repo.
 *
 * Updates download in the background as soon as they are found. Installing
 * waits for the user: either the "Restart to update" button, or the next
 * normal quit (autoInstallOnAppQuit), so a mod install is never cut off.
 */

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000
const FIRST_CHECK_DELAY_MS = 5 * 1000

let status: AppUpdateStatus = { state: 'unsupported' }
let getWindow: () => BrowserWindow | null = () => null
let updater: AppUpdater | null = null

function setStatus(next: AppUpdateStatus): void {
  status = next
  const window = getWindow()
  if (window && !window.isDestroyed()) window.webContents.send(IPC.updateStatus, status)
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function getUpdateStatus(): AppUpdateStatus {
  return status
}

export async function checkForAppUpdate(): Promise<void> {
  // A finished download is not thrown away by a second check.
  if (!updater || status.state === 'ready' || status.state === 'downloading') return
  try {
    await updater.checkForUpdates()
  } catch (error) {
    setStatus({ state: 'error', message: messageOf(error) })
  }
}

export function installAppUpdate(): void {
  if (!updater || status.state !== 'ready') return
  // Silent NSIS run, then relaunch the new version.
  updater.quitAndInstall(true, true)
}

export function initUpdater(windowGetter: () => BrowserWindow | null): void {
  getWindow = windowGetter

  // `npm run dev` has no installer and no app-update.yml to read.
  if (!app.isPackaged) return

  // CommonJS default export; see electron-builder's auto-update docs.
  const { autoUpdater } = electronUpdater
  updater = autoUpdater
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => setStatus({ state: 'checking' }))
  autoUpdater.on('update-not-available', () =>
    setStatus({ state: 'current', version: app.getVersion() }),
  )
  autoUpdater.on('update-available', (info) =>
    setStatus({ state: 'downloading', version: info.version, percent: 0 }),
  )
  autoUpdater.on('download-progress', (progress) => {
    const version = status.state === 'downloading' ? status.version : ''
    setStatus({ state: 'downloading', version, percent: Math.round(progress.percent) })
  })
  autoUpdater.on('update-downloaded', (info) => setStatus({ state: 'ready', version: info.version }))
  autoUpdater.on('error', (error) => setStatus({ state: 'error', message: messageOf(error) }))

  setStatus({ state: 'idle' })
  setTimeout(() => void checkForAppUpdate(), FIRST_CHECK_DELAY_MS)
  setInterval(() => void checkForAppUpdate(), CHECK_INTERVAL_MS)
}
