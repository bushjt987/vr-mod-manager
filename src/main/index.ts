import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow, net, protocol, shell } from 'electron'
import { registerIpc } from './ipc'
import { resolveArt } from './services/artwork'
import { initUpdater } from './services/updater'

let mainWindow: BrowserWindow | null = null

/** Game artwork is served from the local cache over its own scheme. */
const ART_SCHEME = 'vrmm-art'

// Chromium's Windows occlusion tracking can wrongly decide this window is
// covered (VR runtimes and GPU overlays trigger it), marks the page hidden and
// stops presenting frames, so the window stays black or frozen. Rendering stays
// on the GPU; only the occlusion check is turned off. Must run before ready.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion')

// Must run before the app is ready, or the scheme will not be treated as a
// normal origin and the renderer cannot load images from it.
protocol.registerSchemesAsPrivileged([
  { scheme: ART_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

/**
 * vrmm-art://<gameId> resolves to that game's cached header image. A game with
 * no artwork answers 404 and the renderer draws its placeholder instead, so a
 * missing image never reads as a failure.
 */
function registerArtProtocol(): void {
  protocol.handle(ART_SCHEME, async (request) => {
    const gameId = new URL(request.url).hostname
    const file = await resolveArt(gameId)
    if (!file) return new Response(null, { status: 404 })
    return net.fetch(pathToFileURL(file).toString())
  })
}

/** Only real web URLs are worth handing to the system browser. */
function isExternalUrl(url: string): boolean {
  try {
    const protocol = new URL(url).protocol
    return protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:'
  } catch {
    return false
  }
}

function openExternally(url: string): void {
  if (isExternalUrl(url)) void shell.openExternal(url)
}

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: '#0f1115',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // The contextBridge preload here imports from node_modules, which the
      // sandbox forbids. Isolation is what actually keeps the renderer walled
      // off, and that stays on.
      sandbox: false,
    },
  })

  mainWindow = window

  // Painting an empty frame first looks broken; wait for real content.
  window.on('ready-to-show', () => {
    window.show()
  })

  window.on('closed', () => {
    if (mainWindow === window) mainWindow = null
  })

  // The renderer is a local app shell, never a browser: every outbound link
  // belongs in the user's own browser instead of inside this window.
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })

  window.webContents.on('will-navigate', (event, url) => {
    const current = window.webContents.getURL()
    if (url === current) return
    event.preventDefault()
    openExternally(url)
  })

  const devServerUrl = process.env.ELECTRON_RENDERER_URL
  if (devServerUrl) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function focusExistingWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.focus()
}

// A second copy of a mod manager writing into the same game folders is a data
// hazard, so hand the launch over to the window that already exists.
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', focusExistingWindow)

  void app.whenReady().then(() => {
    registerArtProtocol()
    registerIpc(() => mainWindow)
    createWindow()
    initUpdater(() => mainWindow)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
