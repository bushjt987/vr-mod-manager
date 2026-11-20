import fs from 'node:fs/promises'
import path from 'node:path'
import { readRegistryValue } from './registry'

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

/** Locate the Steam client install, or undefined when Steam is not installed. */
export async function findSteamRoot(): Promise<string | undefined> {
  const fromRegistry =
    (await readRegistryValue('HKCU\\Software\\Valve\\Steam', 'SteamPath')) ??
    (await readRegistryValue('HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath'))

  const candidates = [
    fromRegistry,
    'C:\\Program Files (x86)\\Steam',
    'C:\\Program Files\\Steam',
  ].filter((c): c is string => Boolean(c))

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate)
    if (await exists(path.join(normalized, 'steamapps'))) return normalized
  }
  return undefined
}

/**
 * Every steamapps folder Steam knows about, including extra library drives.
 *
 * We deliberately do not parse the nested `apps` block of libraryfolders.vdf --
 * pulling out the `path` entries and then probing for the appmanifest is both
 * simpler and resilient to the format changes Valve has made over the years.
 */
export async function findSteamLibraries(): Promise<string[]> {
  const steamRoot = await findSteamRoot()
  if (!steamRoot) return []

  const libraries = new Set<string>([path.join(steamRoot, 'steamapps')])
  const vdfPath = path.join(steamRoot, 'steamapps', 'libraryfolders.vdf')

  try {
    const vdf = await fs.readFile(vdfPath, 'utf8')
    for (const match of vdf.matchAll(/"path"\s+"([^"]+)"/g)) {
      // VDF escapes backslashes, so C:\\Games becomes C:\Games.
      const libraryPath = match[1].replace(/\\\\/g, '\\')
      libraries.add(path.join(path.normalize(libraryPath), 'steamapps'))
    }
  } catch {
    // No libraryfolders.vdf: the default library above is all we have.
  }

  const usable: string[] = []
  for (const library of libraries) {
    if (await exists(library)) usable.push(library)
  }
  return usable
}

/** Resolve a Steam appid to its install directory, or undefined if not installed. */
export async function findSteamGame(appId: number): Promise<string | undefined> {
  for (const library of await findSteamLibraries()) {
    const manifest = path.join(library, `appmanifest_${appId}.acf`)
    if (!(await exists(manifest))) continue

    try {
      const acf = await fs.readFile(manifest, 'utf8')
      const installDir = acf.match(/"installdir"\s+"([^"]+)"/)?.[1]
      if (!installDir) continue

      const gameRoot = path.join(library, 'common', installDir)
      if (await exists(gameRoot)) return gameRoot
    } catch {
      // Unreadable manifest -- keep checking the other libraries.
    }
  }
  return undefined
}
