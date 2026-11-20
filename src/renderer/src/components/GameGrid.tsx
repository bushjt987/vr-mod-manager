import { Fragment, useEffect, useRef } from 'react'
import type { ReactElement, ReactNode } from 'react'
import type { DetectedGame, GameDef, ModStatus } from '../../../shared/types'
import { cn } from '@/lib/utils'
import { useGridColumns } from '../hooks/useGridColumns'
import GameTile from './GameTile'
import type { BusyKind } from './helpers'

/**
 * A grid of game tiles where the selected tile expands a full-width panel
 * beneath its row.
 *
 * The panel has to land after the LAST tile of the selected tile's row rather
 * than straight after the tile itself, or it would split the row in half. That
 * needs the live column count, which `useGridColumns` reads off the grid.
 *
 * Games arrive sorted A-Z and get a full-width letter divider wherever the
 * initial changes. A divider starts a fresh row, so rows are counted from the
 * start of each letter's section rather than from the top of the grid.
 *
 * Details are supplied by a render prop so this component stays ignorant of the
 * install state, IPC callbacks and error plumbing that the panel needs.
 */

export interface GameGroup {
  game: GameDef
  detected: DetectedGame | undefined
  statuses: ModStatus[]
}

/** The divider a game files under: its initial, or `#` for digits and symbols. */
function letterFor(name: string): string {
  // NFD splits an accented capital into its base letter plus a combining mark.
  const initial = name.normalize('NFD').charAt(0).toUpperCase()
  return /[A-Z]/.test(initial) ? initial : '#'
}

interface GameGridProps {
  groups: GameGroup[]
  selectedGameId: string | null
  busy: Record<string, BusyKind>
  launching: Record<string, true>
  onSelect(gameId: string | null): void
  onLaunch(gameId: string): void
  renderDetails(group: GameGroup): ReactNode
}

export default function GameGrid({
  groups,
  selectedGameId,
  busy,
  launching,
  onSelect,
  onLaunch,
  renderDetails,
}: GameGridProps): ReactElement {
  const gridRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const columns = useGridColumns(gridRef)

  const letters = groups.map((group) => letterFor(group.game.name))

  const selectedIndex = groups.findIndex((group) => group.game.id === selectedGameId)
  const selected = selectedIndex >= 0 ? groups[selectedIndex] : undefined

  // Index of the last tile in the selected tile's row, clamped to the end of
  // its letter section, whose final row is usually short.
  let insertAfter = -1
  if (selectedIndex >= 0) {
    const letter = letters[selectedIndex]
    const sectionStart = letters.indexOf(letter)
    const sectionEnd = letters.lastIndexOf(letter)
    const local = selectedIndex - sectionStart
    insertAfter = Math.min(
      sectionStart + Math.ceil((local + 1) / columns) * columns - 1,
      sectionEnd,
    )
  }

  // Expanding a panel below the fold is useless if you cannot see it.
  useEffect(() => {
    if (!selectedGameId) return
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [selectedGameId])

  useEffect(() => {
    if (!selectedGameId) return undefined
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onSelect(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedGameId, onSelect])

  return (
    <div
      ref={gridRef}
      className="grid grid-cols-[repeat(auto-fill,minmax(min(15rem,100%),1fr))] gap-4"
    >
      {groups.map((group, index) => (
        <Fragment key={group.game.id}>
          {index === 0 || letters[index] !== letters[index - 1] ? (
            <div
              role="separator"
              aria-label={letters[index]}
              className={cn('col-span-full flex items-center gap-3', index > 0 && 'mt-4')}
            >
              <span className="text-sm font-semibold text-muted-foreground">{letters[index]}</span>
              <div className="h-px flex-1 bg-border" aria-hidden="true" />
            </div>
          ) : null}

          <GameTile
            game={group.game}
            detected={group.detected}
            statuses={group.statuses}
            selected={group.game.id === selectedGameId}
            busy={busy}
            launching={Boolean(launching[group.game.id])}
            onLaunch={() => onLaunch(group.game.id)}
            onSelect={() => onSelect(group.game.id === selectedGameId ? null : group.game.id)}
          />

          {index === insertAfter && selected ? (
            <div ref={panelRef} className="col-span-full scroll-mt-28">
              {renderDetails(selected)}
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  )
}
