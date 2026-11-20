import fs from 'node:fs/promises'
import path from 'node:path'
import { GAMES } from '../../shared/catalog'
import type { DetectedGame, GameDef, StoreKind } from '../../shared/types'
import { readRegistryValue } from './registry'
import { findSteamGame } from './steam'

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

async function isDirectory(p: string): Promise<boolean> {
  try {
    return (await fs.stat(p)).isDirectory()
  } catch {
    return false
  }
}

/**
 * Drive letters that currently resolve to something.
 *
 * Probing `X:\` is a single cheap stat per letter and avoids shelling out to
 * wmic/PowerShell, which is slow to spin up and is being deprecated on Win11.
 * All 24 probes run concurrently so the whole sweep costs one round trip.
 */
async function availableDrives(): Promise<string[]> {
  const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const found = await Promise.all(
    letters.map(async (letter) => ((await exists(`${letter}:\\`)) ? letter : undefined)),
  )
  return found.filter((letter): letter is string => letter !== undefined)
}

/** Game Pass installs land in <drive>:\XboxGames\<Title>\Content on every drive the user opted into. */
async function findXboxGame(folderNames: string[]): Promise<string | undefined> {
  const drives = await availableDrives()
  for (const drive of drives) {
    for (const folderName of folderNames) {
      const candidate = path.join(`${drive}:\\`, 'XboxGames', folderName, 'Content')
      if (await isDirectory(candidate)) return candidate
    }
  }
  return undefined
}

/**
 * Registry probes point at either the game folder or its executable depending on
 * which installer wrote the key, so collapse an exe value down to its directory.
 */
async function findViaRegistry(probes: { key: string; value: string }[]): Promise<string | undefined> {
  for (const probe of probes) {
    const raw = await readRegistryValue(probe.key, probe.value)
    if (!raw) continue

    // Some installers store the value wrapped in quotes.
    const cleaned = raw.trim().replace(/^"(.*)"$/, '$1')
    if (cleaned.length === 0) continue

    const normalized = path.normalize(cleaned)
    const root = normalized.toLowerCase().endsWith('.exe') ? path.dirname(normalized) : normalized
    if (await isDirectory(root)) return root
  }
  return undefined
}

/**
 * True when the folder looks like a real install of this game.
 *
 * Deliberately "at least one" rather than "all": the same game ships different
 * marker files across storefronts and revisions, so requiring every path would
 * reject legitimate installs. Guarding against a totally unrelated folder is
 * the goal, not proving the install is pristine.
 */
export async function verifyGameRoot(game: GameDef, root: string): Promise<boolean> {
  if (!(await isDirectory(root))) return false
  // Standalone ports have nothing to match yet -- the user is picking an empty
  // folder to install into, so any real directory is acceptable.
  if (game.verifyPaths.length === 0) return true

  for (const relative of game.verifyPaths) {
    if (await exists(path.join(root, relative))) return true
  }
  return false
}

/** Candidate roots in the order we trust them, tagged with how they were found. */
async function candidateRoots(game: GameDef): Promise<{ root: string; store: StoreKind }[]> {
  const candidates: { root: string; store: StoreKind }[] = []

  if (game.steamAppId !== undefined) {
    const root = await findSteamGame(game.steamAppId)
    if (root) candidates.push({ root, store: 'steam' })
  }

  if (game.xboxFolderNames && game.xboxFolderNames.length > 0) {
    const root = await findXboxGame(game.xboxFolderNames)
    if (root) candidates.push({ root, store: 'xbox' })
  }

  if (game.registryProbes && game.registryProbes.length > 0) {
    const root = await findViaRegistry(game.registryProbes)
    if (root) candidates.push({ root, store: 'retail' })
  }

  return candidates
}

/**
 * Locate one game across Steam, Game Pass and the registry.
 *
 * Standalone entries always return undefined: there is no pre-existing install
 * to find, so the UI has to ask the user where to put it.
 */
export async function detectGame(game: GameDef): Promise<DetectedGame | undefined> {
  if (game.standalone === true) return undefined

  for (const candidate of await candidateRoots(game)) {
    if (await verifyGameRoot(game, candidate.root)) {
      return { gameId: game.id, root: candidate.root, store: candidate.store, manual: false }
    }
  }
  return undefined
}

/** Run detection over the whole catalog. Games that are not installed are simply absent. */
export async function detectAllGames(): Promise<DetectedGame[]> {
  const results = await Promise.all(GAMES.map((game) => detectGame(game)))
  return results.filter((found): found is DetectedGame => found !== undefined)
}
