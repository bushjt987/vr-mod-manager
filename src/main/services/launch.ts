import { spawn } from 'node:child_process'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { shell } from 'electron'
import { MODS } from '@shared/catalog'
import { launchTargets } from '@shared/launch'
import type { DetectedGame, GameDef } from '@shared/types'

async function isFile(target: string): Promise<boolean> {
  try {
    return (await stat(target)).isFile()
  } catch {
    return false
  }
}

/** Resolve a catalog path under the game root, refusing anything that escapes it. */
function underRoot(root: string, relative: string): string | undefined {
  const base = path.resolve(root)
  const full = path.resolve(base, relative)
  const inside = path.relative(base, full)
  if (!inside || inside.startsWith('..') || path.isAbsolute(inside)) return undefined
  return full
}

/**
 * Run a file the way Explorer would, from its own folder.
 *
 * `start` goes through ShellExecute, which is the one route that covers
 * everything a mod might ship: a .cmd gets a real console it can prompt in, and
 * a launcher that demands administrator rights gets a UAC prompt instead of
 * failing outright as it would under a plain spawn. /D sets the working
 * directory, which ports like reVC need to find their data.
 */
function startFile(file: string, wait: boolean): Promise<number> {
  // cmd expands %VAR% even inside quotes, so a path containing one could run
  // something other than the file it names. Windows paths almost never do.
  if (file.includes('%')) {
    throw new Error(`Cannot launch a path containing "%": ${file}`)
  }
  const cwd = path.dirname(file)
  // /s strips exactly the outer pair of quotes, leaving the inner ones intact.
  const command = `"start "" ${wait ? '/wait ' : ''}/D "${cwd}" "${file}""`

  return new Promise((resolve, reject) => {
    const child = spawn('cmd.exe', ['/d', '/v:off', '/s', '/c', command], {
      cwd,
      stdio: 'ignore',
      windowsHide: true,
      windowsVerbatimArguments: true,
    })
    child.once('error', reject)
    child.once('exit', (code) => resolve(code ?? 1))
  })
}

async function runFile(file: string): Promise<void> {
  // `start` returns as soon as the program is running, so a non-zero exit
  // means Windows refused it -- missing, blocked, or UAC declined.
  if ((await startFile(file, false)) !== 0) {
    throw new Error(`Windows could not start ${path.basename(file)}.`)
  }
}

/**
 * Run an .exe as `runFile` does, but hold until it exits.
 *
 * Nothing is reported about how it went: `start /wait` does not carry the
 * program's exit code back out through cmd (a program exiting 2 still reads
 * as 0), so callers judge the outcome from what the program left on disk.
 * Only .exe files: `start` runs a .cmd or .bat under `cmd /K`, whose window
 * stays open after the script ends, so waiting on one would never finish.
 * The caller must check the file exists -- for a missing one `start` raises a
 * modal "cannot find" dialog and waits on that instead.
 */
export async function runFileAndWait(file: string): Promise<void> {
  if (!/\.exe$/i.test(file)) {
    throw new Error(`Only an .exe can be waited on: ${path.basename(file)}`)
  }
  await startFile(file, true)
}

/** Start a game by the first route in `launchTargets` that is actually available. */
export async function launchGame(game: GameDef, detected: DetectedGame): Promise<void> {
  for (const target of launchTargets(game, detected, MODS)) {
    if (target.kind === 'steam') {
      if (!Number.isInteger(target.appId) || target.appId <= 0) continue
      await shell.openExternal(`steam://rungameid/${target.appId}`)
      return
    }

    const file = underRoot(detected.root, target.path)
    if (file && (await isFile(file))) {
      await runFile(file)
      return
    }
  }
  throw new Error(`Found nothing to launch ${game.name} with in ${detected.root}.`)
}
