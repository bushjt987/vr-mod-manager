import { app } from 'electron'
import { GAMES, MODS } from '@shared/catalog'
import type { Progress } from '@shared/types'
import { detectGame } from '../src/main/services/detect'
import { identifyBuild } from '../src/main/services/identify'
import { isModPresent, readInstalledVersion } from '../src/main/services/presence'

/**
 * Read-only check of version identification against the real installs on this
 * PC. Downloads release archives into the normal cache to compare checksums;
 * nothing in any game folder is written.
 */

async function main(): Promise<void> {
  for (const game of GAMES) {
    const detected = await detectGame(game)
    if (!detected) continue

    for (const mod of MODS.filter((candidate) => candidate.gameId === game.id)) {
      if (!(await isModPresent(mod, detected.root))) continue

      console.log(`\n${mod.name}  [${game.name}]`)

      const version = await readInstalledVersion(mod, detected.root)
      if (version) {
        console.log(`  version file : ${version}`)
      } else {
        console.log('  version file : none shipped')
      }

      if (mod.source.kind === 'manual') {
        console.log('  checksum     : skipped, downloaded by hand')
        continue
      }

      const ctx = {
        onProgress(progress: Progress): void {
          if (progress.phase === 'downloading' && progress.total > 0) return
        },
      }

      try {
        const result = await identifyBuild(mod, detected.root, ctx)
        if (result.kind === 'identified')
          console.log(
            `  identified   : ${result.version}` +
              (result.isLatest ? '  (newest)' : `  (behind ${result.latestVersion})`),
          )
        else if (result.kind === 'unrecognised')
          console.log(`  identified   : no match in the last ${result.searched} releases`)
        else console.log(`  identified   : undetermined - ${result.reason}`)
      } catch (error) {
        console.log(`  checksum     : failed - ${error instanceof Error ? error.message : error}`)
      }
    }
  }
  console.log()
  app.exit(0)
}

app.whenReady().then(() =>
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack : error)
    app.exit(1)
  }),
)
