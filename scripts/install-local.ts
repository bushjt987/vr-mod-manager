import os from 'node:os'
import path from 'node:path'
import { app } from 'electron'
import type { Progress } from '@shared/types'
import { installMod, uninstallMod } from '../src/main/services/install'
import { loadState, saveState, setGame } from '../src/main/services/store'

/**
 * Install or uninstall a mod in the user's REAL app state, the same way the
 * app's buttons do, for when the GUI is not convenient. Usage:
 *
 *   electron out/e2e/install-local.mjs <modId> <archive> [gameRoot]
 *   electron out/e2e/install-local.mjs <modId> -          (download the release)
 *   electron out/e2e/install-local.mjs uninstall <modId>
 *
 * gameRoot is only needed when the app has not detected the game yet.
 */

// Same userData as the app itself (package.json "name"), not bare Electron's.
app.setName('vr-mod-manager')

async function main(): Promise<void> {
  const [first, archive, gameRoot] = process.argv.slice(2).filter((arg) => !arg.endsWith('.mjs'))
  if (first === 'uninstall') {
    const before = (await loadState()).installed[archive]
    if (!before) throw new Error(`${archive} is not installed by the manager`)
    await uninstallMod(archive, { onProgress: () => {} })
    console.log(`uninstalled ${archive}: ${before.files.length} files removed, backups restored`)
    return
  }
  const modId = first
  if (!modId || !archive) throw new Error('usage: install-local.mjs <modId> <archive|-> [gameRoot]')

  const { MODS_BY_ID } = await import('@shared/catalog')
  const mod = MODS_BY_ID.get(modId)
  if (!mod) throw new Error(`Unknown mod: ${modId}`)

  if (gameRoot) {
    const state = await loadState()
    if (!state.games[mod.gameId]) {
      await saveState(
        setGame(state, { gameId: mod.gameId, root: path.resolve(gameRoot), store: 'steam', manual: true }),
      )
      console.log(`registered ${mod.gameId} at ${gameRoot}`)
    }
  }

  const archivePath = archive === '-' ? undefined : path.resolve(archive.replace(/^~/, os.homedir()))
  let last = ''
  await installMod(
    { modId, options: [], archivePath },
    {
      onProgress(progress: Progress): void {
        if (progress.phase !== last && progress.phase !== 'copying') console.log(`  ${progress.phase}`)
        last = progress.phase
        if (progress.phase === 'error') console.log(`  ${progress.message}`)
      },
    },
  )

  const record = (await loadState()).installed[modId]
  console.log(`installed ${modId} ${record?.version ?? '?'}: ${record?.files.length ?? 0} files into ${record?.gameRoot}`)
  console.log(`replaced and backed up: ${record?.files.filter((file) => file.backup).length ?? 0}`)
}

app.whenReady().then(() =>
  main()
    .then(() => app.exit(0))
    .catch((error: unknown) => {
      console.error('\nINSTALL ERROR:', error instanceof Error ? error.message : error)
      app.exit(1)
    }),
)
