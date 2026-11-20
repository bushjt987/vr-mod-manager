import type { DetectedGame, GameDef, ModDef } from './types'

/**
 * How to start a game, in the order worth trying.
 *
 * Shared so the renderer and main cannot disagree: the renderer uses it to
 * decide whether a tile gets a Play button and what its tooltip says, main
 * uses it to decide what actually runs.
 */
export type LaunchTarget =
  /** A file under the game root, run with the folder it lives in as its cwd. */
  | { kind: 'file'; path: string; label: string }
  /** Handed to Steam, so overlays, cloud saves and DRM all behave. */
  | { kind: 'steam'; appId: number; label: string }

/** What `launch` and the verifyPaths fallback are allowed to name. */
export const LAUNCHABLE = /\.(exe|bat|cmd)$/i

/**
 * Every way this game could be started, best first.
 *
 * 1. A mod's own launcher. Several VR mods are only active when started
 *    through their launcher or script -- starting the game normally runs it
 *    flat -- so a present mod with `launch` set wins over everything.
 * 2. Steam, for a Steam copy with a known appid.
 * 3. Otherwise an executable from `verifyPaths`. Those
 *    names are already known to belong to the game. Xbox copies are left out:
 *    their executables generally refuse to start outside the Xbox app.
 *
 * `mods` should be the mods present in the game folder. Main passes every mod
 * for the game instead and lets the existence check on disk do the filtering,
 * since a mod's launcher being on disk is proof enough that the mod is there.
 */
export function launchTargets(
  game: GameDef,
  detected: DetectedGame | undefined,
  mods: ModDef[],
): LaunchTarget[] {
  if (!detected) return []
  const targets: LaunchTarget[] = []

  for (const mod of mods) {
    if (mod.gameId !== game.id || !mod.launch || !LAUNCHABLE.test(mod.launch)) continue
    targets.push({ kind: 'file', path: mod.launch, label: `Play with ${mod.name}` })
  }

  if (detected.store === 'steam' && game.steamAppId !== undefined) {
    targets.push({ kind: 'steam', appId: game.steamAppId, label: 'Play on Steam' })
  } else if (detected.store !== 'xbox') {
    for (const relative of game.verifyPaths) {
      if (LAUNCHABLE.test(relative)) targets.push({ kind: 'file', path: relative, label: 'Play' })
    }
  }

  return targets
}
