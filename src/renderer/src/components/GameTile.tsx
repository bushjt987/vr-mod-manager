import type { ReactElement } from 'react'
import { ChevronDown, LoaderCircle, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { launchTargets } from '../../../shared/launch'
import type { DetectedGame, GameDef, ModStatus } from '../../../shared/types'
import GameArt from './GameArt'
import { STORE_LABEL, hasUpdate, modState } from './helpers'
import type { BusyKind } from './helpers'

/**
 * One cell in the grid: a game, not a mod.
 *
 * The tile reports two separate things, because conflating them is genuinely
 * confusing on a grid of games: whether the GAME was found on this PC, and how
 * many of its MODS are installed. A single "Installed" line reads as though it
 * describes the game.
 *
 * Play appears over the centre of the art on hover. It is a sibling laid over
 * the tile rather than a child of it: the tile is itself a button, and buttons
 * cannot nest.
 */

interface GameTileProps {
  game: GameDef
  detected: DetectedGame | undefined
  statuses: ModStatus[]
  selected: boolean
  busy: Record<string, BusyKind>
  launching: boolean
  onSelect(): void
  onLaunch(): void
}

interface ModSummary {
  text: string
  tone: string
  dot: string
  /** Rendered beside the count, in the caution colour. */
  updateNote?: string
}

function summariseMods(detected: DetectedGame | undefined, statuses: ModStatus[]): ModSummary {
  const total = statuses.length
  const noun = total === 1 ? 'mod' : 'mods'

  if (!detected) {
    return {
      text: `${total} ${noun} available`,
      tone: 'text-muted-foreground',
      dot: 'bg-muted-foreground/30',
    }
  }

  // The tile only needs two numbers: how many mods are on disk, and how many of
  // those are behind. Whether this app installed them is the detail panel's
  // business, not the grid's.
  let present = 0
  let updates = 0
  for (const status of statuses) {
    const state = modState(status)
    if (state === 'update' || state === 'installed' || state === 'unmanaged') present += 1

    // hasUpdate covers both the managed and the hand-installed case.
    if (hasUpdate(status)) updates += 1
  }

  if (present === 0) {
    return {
      text: total === 1 ? 'Mod not installed' : 'No mods installed',
      tone: 'text-muted-foreground',
      dot: 'bg-muted-foreground',
    }
  }
  // Installed stays green and keeps its count; an outstanding update rides
  // alongside it in orange rather than replacing it, so the tile says both
  // things at once. Installed is installed, however it got there.
  const installedText = `${present} ${present === 1 ? 'mod' : 'mods'} installed`
  if (updates > 0) {
    return {
      text: installedText,
      tone: 'text-ok',
      dot: 'bg-ok',
      // Same wording as the mod card, so the two never describe the same
      // situation differently.
      updateNote: updates === 1 ? 'update available' : `${updates} updates available`,
    }
  }
  return { text: installedText, tone: 'text-ok', dot: 'bg-ok' }
}

export default function GameTile({
  game,
  detected,
  statuses,
  selected,
  busy,
  launching,
  onSelect,
  onLaunch,
}: GameTileProps): ReactElement {
  const mods = summariseMods(detected, statuses)
  const isBusy = statuses.some((status) => busy[status.mod.id])
  const present = statuses
    .filter((status) => status.installed || status.presentUnmanaged)
    .map((status) => status.mod)
  // The first route is the one main will take, give or take a launcher that
  // has gone missing from disk since the last scan.
  const launch = launchTargets(game, detected, present)[0]

  return (
    <div className="group/tile relative flex flex-col">
      <button
        type="button"
        onClick={onSelect}
        aria-expanded={selected}
        aria-label={`${game.name}. ${detected ? 'Game installed' : 'Game not installed'}. ${mods.text}.`}
        className={cn(
          'group relative flex flex-1 flex-col overflow-hidden rounded-lg border text-left transition-colors',
          'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
          selected
            ? 'border-primary bg-card shadow-[0_0_0_1px_var(--primary)]'
            : 'border-border bg-card/60 hover:border-border/80 hover:bg-card',
          !detected && 'opacity-75',
        )}
      >
        <div className="relative">
          <GameArt game={game} className={cn('aspect-[46/21] w-full', !detected && 'grayscale')} />
          {/* Key art varies wildly in brightness, so fade its base into the card
              to give the text below a stable edge to sit against. */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent" />
          {isBusy ? (
            <span className="absolute top-2 right-2 rounded-full bg-background/85 p-1.5">
              <LoaderCircle className="size-3.5 animate-spin text-primary" />
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <span className="line-clamp-2 text-sm leading-snug font-medium">{game.name}</span>

          <div className="mt-auto flex flex-col gap-1 pt-1">
            {/* Line one is about the GAME. */}
            <span className="truncate text-xs text-muted-foreground">
              {detected
                ? `Game installed${detected.store ? ` · ${STORE_LABEL[detected.store]}` : ''}`
                : 'Game not installed'}
            </span>

            {/* Line two is about its MODS. */}
            <div className="flex items-center gap-1.5">
              <span className={cn('size-1.5 shrink-0 rounded-full', mods.dot)} aria-hidden="true" />
              <span className={cn('truncate text-xs', mods.tone)}>{mods.text}</span>
              {mods.updateNote ? (
                <span className="truncate text-xs font-medium text-caution">{mods.updateNote}</span>
              ) : null}
              <ChevronDown
                className={cn(
                  'ml-auto size-4 shrink-0 text-muted-foreground transition-transform',
                  selected && 'rotate-180 text-primary',
                )}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </button>

      {/* Hidden mid-install: launching over files being copied is asking for a crash.
          The overlay matches the art's box and lets clicks through to the tile
          everywhere but the button itself. */}
      {launch && !isBusy ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-px top-px grid aspect-[46/21] place-items-center',
            'rounded-t-lg transition-colors group-hover/tile:bg-black/35',
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onLaunch}
                disabled={launching}
                aria-label={`${launch.label}: ${game.name}`}
                className={cn(
                  'pointer-events-auto flex size-14 items-center justify-center rounded-full',
                  'bg-primary text-primary-foreground shadow-lg shadow-black/50 transition',
                  'hover:scale-110 hover:bg-primary/90 disabled:opacity-70',
                  // Keyboard users get it on focus, since they never hover.
                  'scale-90 opacity-0 group-hover/tile:scale-100 group-hover/tile:opacity-100',
                  'focus-visible:scale-100 focus-visible:opacity-100',
                  'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                  // Stay put while the launch is in flight, even if the pointer leaves.
                  launching && 'scale-100 opacity-100',
                )}
              >
                {launching ? (
                  <LoaderCircle className="size-6 animate-spin" />
                ) : (
                  <Play className="ml-1 size-6 fill-current" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{launch.label}</TooltipContent>
          </Tooltip>
        </div>
      ) : null}
    </div>
  )
}
