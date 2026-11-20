import { useState } from 'react'
import type { ReactElement } from 'react'
import { cn } from '@/lib/utils'
import type { GameDef } from '../../../shared/types'

/**
 * Header artwork for a game.
 *
 * The image comes from the main process over the vrmm-art scheme, which caches
 * it on disk. Games that were never on Steam have no artwork at all, so this
 * falls back to a generated tile rather than a broken image -- three of the
 * catalog's games are in that position today.
 *
 * Sizing is the caller's business: the art is used both as a wide tile banner
 * and as a small inline thumbnail, so only the shared framing lives here.
 */

const FRAME = 'block bg-muted object-cover'

/** Deterministic, so a game keeps the same placeholder colour between launches. */
function hueFor(id: string): number {
  let hash = 0
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) % 360
  }
  return hash
}

interface GameArtProps {
  game: GameDef
  /** Sizing and rounding for this usage. */
  className?: string
}

export default function GameArt({ game, className }: GameArtProps): ReactElement {
  const [failed, setFailed] = useState(false)

  if (failed) {
    const hue = hueFor(game.id)
    return (
      <div
        className={cn(FRAME, 'grid select-none place-items-center', className)}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 34% 26%), hsl(${(hue + 40) % 360} 30% 15%))`,
        }}
        aria-hidden="true"
      >
        <span className="line-clamp-3 px-3 text-center text-sm leading-tight font-semibold text-balance text-foreground/85">
          {game.name}
        </span>
      </div>
    )
  }

  return (
    <img
      className={cn(FRAME, className)}
      src={`vrmm-art://${game.id}`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
