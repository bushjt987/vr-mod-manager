import fs from 'node:fs/promises'
import path from 'node:path'
import { app } from 'electron'
import { GAMES_BY_ID } from '@shared/catalog'
import type { GameDef } from '@shared/types'
import { downloadFile } from './download'

/**
 * Header art for each game.
 *
 * Steam publishes capsule art on its CDN at a predictable path keyed by appid,
 * with no API key and no auth, so a `steamAppId` in the catalog is all we need.
 * Games that were never on Steam (Halo CE retail, Ship of Harkinian) fall back
 * to an `artUrl` override, or to a placeholder the renderer draws itself.
 *
 * Images are cached under userData and served over a custom protocol rather
 * than hot-linked from the renderer, which keeps the app working offline after
 * the first fetch and avoids opening the renderer's CSP up to a remote host.
 */

/** 460x215 landscape capsule -- the shape the game header row wants. */
function steamHeaderUrl(appId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`
}

export function artUrlFor(game: GameDef): string | undefined {
  if (game.artUrl) return game.artUrl
  if (game.steamAppId !== undefined) return steamHeaderUrl(game.steamAppId)
  return undefined
}

/**
 * The header URL Steam's own store API reports for an app.
 *
 * Newer apps keep their art under a content-hashed folder, so the fixed path
 * above 404s for them (Resident Evil Requiem does). The hash changes whenever
 * the art is updated, so it is looked up rather than pinned in the catalog.
 */
async function steamStoreHeaderUrl(appId: number): Promise<string | undefined> {
  const response = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=basic`,
    { headers: { 'User-Agent': 'vr-mod-manager' } },
  )
  if (!response.ok) return undefined
  const body = (await response.json()) as Record<string, { data?: { header_image?: unknown } }>
  const url = body[String(appId)]?.data?.header_image
  return typeof url === 'string' && url.startsWith('https://') ? url : undefined
}

function artDir(): string {
  return path.join(app.getPath('userData'), 'art')
}

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

/**
 * Remember which games have no art, or whose fetch failed, so a game section
 * scrolling in and out of view does not retry a dead URL on every render.
 */
const misses = new Set<string>()

/**
 * Local path to a game's cached artwork, fetching it first if needed.
 * Returns undefined when the game has no art or the fetch failed -- a missing
 * image is a cosmetic problem and must never surface as an error.
 */
export async function resolveArt(gameId: string): Promise<string | undefined> {
  if (misses.has(gameId)) return undefined

  const game = GAMES_BY_ID.get(gameId)
  if (!game) return undefined

  const source = artUrlFor(game)
  if (!source) {
    misses.add(gameId)
    return undefined
  }

  const cached = path.join(artDir(), `${gameId}.jpg`)
  if (await exists(cached)) return cached

  try {
    await downloadFile(source, cached)
    return cached
  } catch {
    // Fall through to asking the store where the art lives now.
  }

  if (!game.artUrl && game.steamAppId !== undefined) {
    try {
      const fallback = await steamStoreHeaderUrl(game.steamAppId)
      if (fallback) {
        await downloadFile(fallback, cached)
        return cached
      }
    } catch {
      // Offline as well. Same outcome as no art at all.
    }
  }

  // Draw the placeholder instead.
  misses.add(gameId)
  return undefined
}
