import fs from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'
import type { AppState, DetectedGame, IdentifiedBuild, InstalledMod } from '../../shared/types'

function statePath(): string {
  // Resolved lazily: app.getPath throws before the app is ready.
  return path.join(app.getPath('userData'), 'state.json')
}

function emptyState(): AppState {
  return { games: {}, installed: {}, identified: {} }
}

/**
 * Read persisted state, falling back to an empty state.
 *
 * This must never throw: a missing or half-written state.json should leave the
 * user with a working app that simply re-detects their games, not a crash on
 * launch with no way to recover short of deleting the file by hand.
 */
export async function loadState(): Promise<AppState> {
  try {
    const raw = await fs.readFile(statePath(), 'utf8')
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return emptyState()

    const candidate = parsed as Partial<AppState>
    return {
      games: isRecord(candidate.games) ? candidate.games : {},
      installed: isRecord(candidate.installed) ? candidate.installed : {},
      // Absent in state files written before build identification existed.
      identified: isRecord(candidate.identified) ? candidate.identified : {},
    }
  } catch {
    // Missing file, bad JSON, unreadable disk -- all mean "start fresh".
    return emptyState()
  }
}

function isRecord<T>(value: unknown): value is Record<string, T> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Persist state through a temp file + rename.
 *
 * Writing in place would leave a truncated, unparseable state.json if the
 * process died mid-write; rename is atomic, so readers see either the old file
 * or the complete new one.
 */
export async function saveState(state: AppState): Promise<void> {
  const target = statePath()
  const temp = `${target}.tmp`
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await fs.rename(temp, target)
}

export function setGame(state: AppState, game: DetectedGame): AppState {
  state.games[game.gameId] = game
  return state
}

export function setInstalled(state: AppState, record: InstalledMod): AppState {
  state.installed[record.modId] = record
  return state
}

export function removeInstalled(state: AppState, modId: string): AppState {
  delete state.installed[modId]
  return state
}

export function setIdentified(
  state: AppState,
  modId: string,
  build: IdentifiedBuild,
): AppState {
  state.identified[modId] = build
  return state
}

export function removeIdentified(state: AppState, modId: string): AppState {
  delete state.identified[modId]
  return state
}
