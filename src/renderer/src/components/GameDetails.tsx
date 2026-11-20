import type { ReactElement } from 'react'
import {
  Download,
  FolderOpen,
  FolderSearch,
  Info,
  RefreshCw,
  TriangleAlert,
  X,
} from 'lucide-react'
import type { IdentifyOutcome } from '../../../shared/api'
import type { DetectedGame, GameDef, ModStatus, Progress } from '../../../shared/types'
import ModDetails from './ModDetails'
import { STORE_LABEL, elideMiddle } from './helpers'
import type { BusyKind, ModActions } from './helpers'
import { blockingConflict, missingRequirements } from './helpers'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface GameDetailsProps {
  game: GameDef
  detected: DetectedGame | undefined
  statuses: ModStatus[]
  gameError: string | undefined
  progress: Record<string, Progress>
  busy: Record<string, BusyKind>
  modErrors: Record<string, string>
  optionsByMod: Record<string, string[]>
  archives: Record<string, string>
  manualOpen: Record<string, boolean>
  /** Checksum results for hand-installed mods, keyed by mod id. */
  identified: Record<string, IdentifyOutcome>
  /** Every status in the catalog, so cross-game requirements can be resolved. */
  allStatuses: ModStatus[]
  actions: ModActions
  onClose(): void
}

/**
 * The expanded row that opens underneath a game tile: one statement of where
 * the game lives, then every mod that targets it.
 */
export default function GameDetails(props: GameDetailsProps): ReactElement {
  const { game, detected, statuses, gameError, actions } = props
  const locateLabel = game.standalone ? 'Choose install folder...' : 'Locate game folder...'
  // Only mods that actually declare a conflict are alternatives. Sharing a game
  // is not enough -- GRAND-MotherVR is layered on MotherVR, and RE4VR on
  // REFramework, so those are meant to be installed together.
  const hasAlternatives = statuses.some((status) =>
    statuses.some(
      (other) => other.mod.id !== status.mod.id && status.mod.conflictsWith?.includes(other.mod.id),
    ),
  )

  return (
    <section
      // The accent top edge is the visual tie back to the selected tile above.
      className="relative rounded-lg border border-border border-t-2 border-t-primary/60 bg-card/60 p-5 shadow-sm"
      aria-label={`${game.name} details`}
    >
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="absolute top-3 right-3 z-10 text-muted-foreground"
        aria-label="Close details"
        onClick={props.onClose}
      >
        <X aria-hidden="true" />
      </Button>

      {/* ---- game header ---- */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pr-10">
        <h2 className="text-lg leading-tight font-semibold text-foreground">{game.name}</h2>
        <div className="flex flex-wrap items-center gap-1.5">
          {game.stores.map((store) => (
            <Badge key={store} variant="outline" className="text-muted-foreground">
              {STORE_LABEL[store]}
            </Badge>
          ))}
          <Badge variant="secondary">
            {statuses.length} {statuses.length === 1 ? 'mod' : 'mods'}
          </Badge>
        </div>
      </div>

      {/* min-w-0 is load-bearing: without it a long install path stretches this
          row and forces the whole window to scroll sideways. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        {detected ? (
          <>
            <div className="flex min-w-0 flex-1 basis-64 items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="min-w-0 truncate text-xs text-muted-foreground"
                    title={detected.root}
                  >
                    {elideMiddle(detected.root, 64)}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[32rem] break-all">{detected.root}</TooltipContent>
              </Tooltip>
              <span
                className={
                  detected.manual
                    ? 'shrink-0 text-xs text-caution'
                    : 'shrink-0 text-xs text-muted-foreground'
                }
              >
                {detected.manual ? 'set manually' : 'auto-detected'}
              </span>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => actions.openFolder(detected.root)}
              >
                <FolderOpen aria-hidden="true" />
                Open game folder
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => actions.locateGame(game.id)}
              >
                <FolderSearch aria-hidden="true" />
                Change folder...
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="min-w-0 flex-1 basis-64 truncate text-xs text-muted-foreground italic">
              {game.standalone ? 'No install folder chosen yet.' : 'Not detected on this PC.'}
            </span>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={() => actions.locateGame(game.id)}>
                <FolderSearch aria-hidden="true" />
                {locateLabel}
              </Button>
              {/* Only Steam exposes a protocol we can hand a game off to. */}
              {game.steamAppId !== undefined ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => actions.installGame(game.id)}
                  title="Opens Steam's install dialog for this game. Re-scan once it has finished."
                >
                  <Download aria-hidden="true" />
                  Install on Steam
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="ghost" onClick={() => actions.rescan()}>
                <RefreshCw aria-hidden="true" />
                Re-scan
              </Button>
            </div>
          </>
        )}
      </div>

      {gameError ? (
        <Alert variant="destructive" className="mt-3">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{gameError}</AlertDescription>
        </Alert>
      ) : null}

      <Separator className="mt-4 mb-4" />

      {/* Several games carry two competing mods (BioShock, F.E.A.R.); they
          overwrite each other's files, so say so before the list. */}
      {hasAlternatives ? (
        <p className="mb-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Some of these mods are competing versions of the same thing. Installing one rules the
            other out.
          </span>
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {statuses.map((status) => (
          <ModDetails
            key={status.mod.id}
            status={status}
            progress={props.progress[status.mod.id]}
            busy={props.busy[status.mod.id]}
            error={props.modErrors[status.mod.id]}
            options={props.optionsByMod[status.mod.id] ?? []}
            archivePath={props.archives[status.mod.id]}
            manualOpen={props.manualOpen[status.mod.id] ?? false}
            identifyResult={props.identified[status.mod.id]}
            blockedBy={blockingConflict(status, statuses)?.mod.name}
            missingRequires={missingRequirements(status, props.allStatuses)}
            actions={actions}
          />
        ))}
      </div>
    </section>
  )
}
