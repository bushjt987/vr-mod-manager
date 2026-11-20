import { MODS } from '@shared/catalog'
import { resolveRelease } from '../src/main/services/release'

/**
 * Resolve every downloadable mod through the app's own resolver.
 *
 * Mod authors rename their release assets, which silently breaks an
 * assetPattern until someone tries to install. This exercises the real code
 * path rather than a second implementation of it, so a pass here means the app
 * can actually download every mod in the catalog.
 */
async function main(): Promise<void> {
  let broken = 0

  for (const mod of MODS) {
    if (mod.source.kind === 'manual') continue
    try {
      const release = await resolveRelease(mod.source)
      console.log(`  OK    ${mod.id.padEnd(30)} ${release.version.padEnd(24)} -> ${release.assetName}`)
    } catch (error) {
      broken += 1
      console.log(`  FAIL  ${mod.id.padEnd(30)} ${error instanceof Error ? error.message : error}`)
    }
  }

  console.log(broken === 0 ? '\nEvery source resolves.\n' : `\n${broken} BROKEN\n`)
  process.exit(broken === 0 ? 0 : 1)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
