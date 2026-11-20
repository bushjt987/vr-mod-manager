import { createHash } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { ModDef } from '@shared/types'
import { sha256File } from './download'

/**
 * Spotting mods that are already installed.
 *
 * The install records in state.json only cover installs this manager performed,
 * so a mod the user dropped in by hand was previously invisible. This looks for
 * the mod's own files in the game folder instead.
 *
 * Presence is all this can honestly report. There is no version to read -- the
 * files carry none -- and no backups exist for something we did not displace,
 * so an unmanaged install can be recognised and overwritten but never cleanly
 * removed from here.
 */

/**
 * The paths that indicate a mod is present.
 *
 * An explicit `fingerprint` wins. Otherwise it is derived from the copy steps
 * that name a specific file, which is exactly how `install.ts` places them:
 * into `to`, under the file's own basename. Wildcard steps are skipped because
 * their contents are only known once the archive has been downloaded.
 */
export function fingerprintFor(mod: ModDef): string[] {
  if (mod.fingerprint && mod.fingerprint.length > 0) return mod.fingerprint

  return mod.install.steps
    .filter((step) => step.from !== '**' && !step.from.endsWith('/**') && !step.optional)
    .map((step) => {
      const dir = step.to === '.' ? '' : step.to
      return path.posix.join(dir, path.posix.basename(step.from))
    })
}

/**
 * Is this mod's payload sitting in the game folder?
 *
 * Every fingerprint path must exist. Requiring all of them avoids claiming a
 * mod is installed on the strength of one file that two mods happen to share --
 * the BioShock mods both ship an `xinput1_3.dll`, for instance.
 */
export async function isModPresent(mod: ModDef, gameRoot: string): Promise<boolean> {
  const paths = fingerprintFor(mod)
  if (paths.length === 0) return false

  for (const relative of paths) {
    try {
      await fs.access(path.join(gameRoot, relative))
    } catch {
      return false
    }
  }
  return true
}

/**
 * Read the installed version of a mod from whatever metadata file it ships.
 *
 * Returns undefined when the mod records no version, which is the common case:
 * of the mods in this catalog only REFramework, KisakCOD VR and F.E.A.R. VR
 * write one, and mod DLLs leave their PE version resource empty.
 */
export async function readInstalledVersion(
  mod: ModDef,
  gameRoot: string,
): Promise<string | undefined> {
  const source = mod.versionFrom
  if (!source) return undefined

  let raw: string
  try {
    raw = await fs.readFile(path.join(gameRoot, source.path), 'utf8')
  } catch {
    return undefined
  }
  // Strip a BOM; the F.E.A.R. manifest ships one and JSON.parse chokes on it.
  raw = raw.replace(/^\uFEFF/, '')

  if (source.field) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return undefined
      const value = (parsed as Record<string, unknown>)[source.field]
      return typeof value === 'string' && value.length > 0 ? value : undefined
    } catch {
      return undefined
    }
  }

  if (source.pattern) {
    const match = raw.match(new RegExp(source.pattern))
    return match?.[1]?.trim() || undefined
  }

  const trimmed = raw.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

/**
 * A hash over the mod's own files, used to tell whether an install has changed
 * since we last identified it. Cheap and entirely local -- no network.
 */
export async function fingerprintSignature(
  mod: ModDef,
  gameRoot: string,
): Promise<string | undefined> {
  const files = fingerprintFor(mod).filter((entry) => path.posix.extname(entry) !== '')
  if (files.length === 0) return undefined

  const hash = createHash('sha256')
  for (const relative of files.sort()) {
    try {
      hash.update(relative)
      hash.update(await sha256File(path.join(gameRoot, relative)))
    } catch {
      return undefined
    }
  }
  return hash.digest('hex')
}
