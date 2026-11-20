import path from 'node:path'
import { app } from 'electron'
import { GAMES, MODS } from '@shared/catalog'
import { detectGame } from '../src/main/services/detect'
import { loadState } from '../src/main/services/store'
import { fingerprintFor, isModPresent } from '../src/main/services/presence'

/**
 * Read-only report: which catalog games are on this PC, and which mods are
 * already sitting in their folders.
 *
 * Nothing is written. This is the same detection the app runs, exercised
 * outside Electron so it can be checked against a real machine.
 */

async function main(): Promise<void> {
  // Run bare, Electron resolves userData from its own default app name, so
  // point it at the real one or saved paths read as empty.
  app.setPath('userData', path.join(app.getPath('appData'), 'vr-mod-manager'))

  let gamesFound = 0
  let modsFound = 0

  // Saved paths matter as much as detection: standalone games are never
  // auto-detected, so a folder the user pointed at is the only record of them.
  const saved = (await loadState()).games

  for (const game of GAMES) {
    const detected = (await detectGame(game)) ?? saved[game.id]
    if (!detected) continue
    gamesFound += 1

    console.log(`\n${game.name}`)
    console.log(`  ${detected.root}  [${detected.store}]`)

    for (const mod of MODS.filter((candidate) => candidate.gameId === game.id)) {
      const fingerprint = fingerprintFor(mod)
      if (fingerprint.length === 0) {
        console.log(`    ?  ${mod.name} -- no fingerprint, cannot be detected on disk`)
        continue
      }

      const present = await isModPresent(mod, detected.root)
      if (present) modsFound += 1
      // Always print the paths, found or not, so a result can be checked
      // against the disk by hand.
      console.log(`    ${present ? 'FOUND     ' : 'not found '} ${mod.name}`)
      console.log(`                 ${fingerprint.join('\n                 ')}`)
    }
  }

  console.log(`\n${gamesFound} games detected, ${modsFound} mods already installed.\n`)
  // Without a window, nothing else will end the process.
  app.exit(0)
}

app.whenReady().then(() =>
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack : error)
    app.exit(1)
  }),
)
