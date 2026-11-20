import type { ReactElement, ReactNode } from 'react'
import {
  BookOpen,
  ChevronDown,
  Download,
  ExternalLink,
  FolderOpen,
  FolderSearch,
  LoaderCircle,
  RefreshCw,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import type { ModStatus, Progress } from '../../../shared/types'
import MaturityBadge from './MaturityBadge'
import ProgressLine from './ProgressLine'
import {
  STORE_LABEL,
  elideMiddle,
  formatDate,
  formatVersion,
  isGuideOnly,
  modState,
  stateLabel,
  hasUpdate,
  unmanagedLabel,
} from './helpers'
import type { IdentifyOutcome } from '../../../shared/api'
import type { BusyKind, ModActions, ModState } from './helpers'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface ModDetailsProps {
  status: ModStatus
  progress: Progress | undefined
  busy: BusyKind | undefined
  error: string | undefined
  options: string[]
  archivePath: string | undefined
  manualOpen: boolean
  /** Result of checksumming a hand-installed mod against the newest release. */
  identifyResult?: IdentifyOutcome
  /** Name of an installed mod that rules this one out, if any. */
  blockedBy?: string
  /** Names of prerequisite mods that are not installed. */
  missingRequires?: string[]
  actions: ModActions
}

const BUSY_LABEL: Record<BusyKind, string> = {
  install: 'Installing...',
  update: 'Updating...',
  uninstall: 'Removing...',
}

/** Colour of the state dot + label in the meta row. */
const STATE_TONE: Record<ModState, string> = {
  'no-game': 'text-muted-foreground',
  'not-installed': 'text-muted-foreground',
  unmanaged: 'text-ok',
  installed: 'text-ok',
  update: 'text-caution',
}

const STATE_DOT: Record<ModState, string> = {
  'no-game': 'bg-muted-foreground/60',
  'not-installed': 'bg-muted-foreground/60',
  unmanaged: 'bg-ok',
  installed: 'bg-ok',
  update: 'bg-caution',
}

function SectionTitle({ children }: { children: ReactNode }): ReactElement {
  return (
    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</p>
  )
}

/**
 * One mod inside the expanded game panel.
 *
 * Everything game-level -- the resolved path, the locate/re-scan controls, the
 * game error -- belongs to GameDetails instead, so it is stated once per game
 * rather than repeated under every mod.
 */
export default function ModDetails(props: ModDetailsProps): ReactElement {
  const {
    status,
    progress,
    busy,
    error,
    options,
    archivePath,
    manualOpen,
    identifyResult,
    blockedBy,
    missingRequires,
    actions,
  } = props
  const { mod, game, installed, latest, latestError } = status

  const state = modState(status)
  const guideOnly = isGuideOnly(mod)
  const manual = mod.source.kind === 'manual' ? mod.source : null
  const installer = mod.install.installer
  const guideUrl = manual ? manual.url : mod.homepage
  const isBusy = busy !== undefined
  // A conflicting install blocks anything that would write files.
  const blocked = blockedBy !== undefined
  const modOptions = mod.options ?? []
  const showOptions = modOptions.length > 0 && !guideOnly
  const showManual = manual !== null && !guideOnly && manualOpen
  const showGuideText = guideOnly && manual !== null
  const showNoGameNote = !guideOnly && state === 'no-game'
  const showInstallerText = installer !== undefined && state !== 'no-game'
  const hasLeft = showOptions || showManual || showGuideText || showNoGameNote || showInstallerText
  const locateLabel = game.standalone ? 'Choose install folder...' : 'Locate game folder...'

  /**
   * A hand-installed mod has no version until either it ships one or a checksum
   * identifies it. Both feed a single value so the panel cannot claim the
   * version is unknown in one line and name it in the next.
   */
  const knownVersion =
    status.detectedVersion ??
    (identifyResult?.kind === 'identified' ? identifyResult.version : undefined)

  const presentLabel = unmanagedLabel(mod, knownVersion)

  /** Known to be behind: derived from `status`, so it survives a restart. */
  const isBehind = state === 'unmanaged' && hasUpdate(status)
  /** An update is genuinely available -- managed, or identified as behind. */
  const showUpdate = state === 'update' || isBehind

  /**
   * Some mods verify the exact executable and reject other editions, so owning
   * the game is not the same as being able to run the mod.
   */
  const storeMismatch =
    mod.requiresStore !== undefined &&
    status.detected !== undefined &&
    !mod.requiresStore.includes(status.detected.store)


  return (
    <section
      className={cn(
        '@container flex flex-col gap-4 rounded-md border border-border/60 bg-background/40 p-4',
        blockedBy && 'opacity-55',
      )}
      aria-label={`${mod.name} details`}
    >
      {/* ---- mod identity ---- */}
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3 className="text-lg leading-tight font-semibold text-foreground">{mod.name}</h3>
          <MaturityBadge maturity={mod.maturity} />
          {mod.kind === 'pc-port' ? <Badge variant="secondary">PC port</Badge> : null}
          {guideOnly ? (
            <Badge variant="outline" className="text-muted-foreground">
              Guide only
            </Badge>
          ) : null}
          {mod.requiresStore ? (
            <Badge
              variant="outline"
              className={cn(
                storeMismatch ? 'border-caution/40 text-caution' : 'text-muted-foreground',
              )}
              title={
                storeMismatch
                  ? 'Your copy of this game is from a different storefront, so this mod will not run on it.'
                  : undefined
              }
            >
              {mod.requiresStore.map((store) => STORE_LABEL[store]).join(' / ')} only
            </Badge>
          ) : null}
          {installer ? (
            <Badge variant="outline" className="text-muted-foreground">
              Runs its own setup
            </Badge>
          ) : null}
          {manual && !guideOnly ? (
            <Badge variant="outline" className="text-muted-foreground">
              Manual download
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">by {mod.author}</p>
      </div>

      {missingRequires && missingRequires.length > 0 ? (
        <p className="flex items-start gap-1.5 text-xs text-warn" role="status">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Needs {missingRequires.join(' and ')} installed first - this is a plugin for it, not a
            standalone mod. Install it from here, or point this app at an existing copy.
          </span>
        </p>
      ) : null}

      {blockedBy ? (
        <p className="flex items-start gap-1.5 text-xs text-caution" role="status">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            Can&rsquo;t be installed while {blockedBy} is installed - they are competing versions of
            the same mod and overwrite each other. Remove that one first.
          </span>
        </p>
      ) : null}

      {/* ---- state line ---- */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <span className={cn('flex items-center gap-1.5 font-medium', STATE_TONE[state])}>
          <span className={cn('size-1.5 rounded-full', STATE_DOT[state])} aria-hidden="true" />
          {state === 'unmanaged' ? presentLabel : stateLabel(status)}
        </span>
        {installed && latest && state === 'update' ? (
          <span className="text-muted-foreground tabular-nums">
            {formatVersion(installed.version)} &rarr;{' '}
            <span className="font-medium text-caution">{formatVersion(latest.version)}</span>
          </span>
        ) : installed && formatDate(installed.installedAt) ? (
          <span className="text-muted-foreground tabular-nums">
            installed {formatDate(installed.installedAt)}
          </span>
        ) : latest && knownVersion ? (
          /* The version numbers are already on the line before this, so say
             what they mean rather than repeating them. */
          <span className={isBehind ? 'font-medium text-caution' : 'text-muted-foreground'}>
            {isBehind ? 'update available' : 'latest installed'}
          </span>
        ) : latest ? (
          <span className="text-muted-foreground tabular-nums">
            latest {formatVersion(latest.version)}
          </span>
        ) : null}

        {/* Checksum verdict for a hand-installed mod, once one has been run. */}
        {state === 'unmanaged' && identifyResult && identifyResult.kind !== 'identified' ? (
          <span
            className="text-muted-foreground"
            role="status"
          >
            {identifyResult.kind === 'unrecognised'
              ? `matches none of the last ${identifyResult.searched} releases - edited, or older`
              : identifyResult.reason}
          </span>
        ) : null}
      </div>

      {/* A failed release lookup is a warning, never a blocker -- the action
          buttons stay live so an already-cached version can still be used. */}
      {latestError ? (
        <p className="flex items-start gap-1.5 text-xs text-warn" role="status">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>Could not check for the latest release: {latestError}</span>
        </p>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {progress ? <ProgressLine progress={progress} /> : null}

      {/* ---- what the update contains ---- */}
      {showUpdate && latest?.notes ? (
        <Collapsible>
          <CollapsibleTrigger className="group flex w-full items-center gap-1.5 rounded-md border border-caution/30 bg-caution/5 px-3 py-2 text-left text-xs font-medium text-caution hover:bg-caution/10">
            <ChevronDown
              className="size-3.5 shrink-0 transition-transform group-data-[state=open]:rotate-180"
              aria-hidden="true"
            />
            What&rsquo;s new in {formatVersion(latest.version)}
            {latest.title ? (
              <span className="truncate font-normal text-muted-foreground">
                &mdash; {latest.title}
              </span>
            ) : null}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-border bg-background/60 p-3 text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {latest.notes}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {/* ---- options and manual-source panel ---- */}
      {hasLeft ? (
        <div className="grid items-start gap-4">
          {hasLeft ? (
            <div className="flex min-w-0 flex-col gap-3">
              {showGuideText && manual ? (
                <p className="text-sm text-muted-foreground">{manual.instructions}</p>
              ) : null}

              {showInstallerText && installer ? (
                <p className="text-sm text-muted-foreground">
                  Install, Update and Uninstall open the mod&rsquo;s own setup and wait for it to
                  close. {installer.instructions}
                </p>
              ) : null}

              {showNoGameNote ? (
                <p className="text-sm text-muted-foreground">
                  {game.name} has not been located yet, so this mod cannot be installed.
                </p>
              ) : null}

              {showOptions ? (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
                  <SectionTitle>Install options</SectionTitle>
                  {modOptions.map((option) => {
                    const checked = options.includes(option.id)
                    const inputId = `details-${mod.id}-option-${option.id}`
                    return (
                      <div key={option.id} className="flex items-start gap-2.5">
                        <Checkbox
                          id={inputId}
                          className="mt-0.5"
                          checked={checked}
                          disabled={isBusy || blocked}
                          onCheckedChange={(next) =>
                            actions.toggleOption(status, option.id, next === true)
                          }
                        />
                        <label
                          htmlFor={inputId}
                          className="min-w-0 cursor-pointer text-sm leading-tight"
                        >
                          <span className="block font-medium text-foreground">{option.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {showManual && manual ? (
                <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-sm font-semibold text-foreground">Manual download required</p>
                  <p className="text-sm text-muted-foreground">{manual.instructions}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => actions.openExternal(manual.url)}
                    >
                      <ExternalLink aria-hidden="true" />
                      Open download page
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isBusy || blocked}
                      onClick={() => actions.chooseArchive(mod.id)}
                    >
                      <FolderOpen aria-hidden="true" />
                      Choose downloaded file...
                    </Button>
                  </div>
                  {archivePath ? (
                    <p className="text-xs text-muted-foreground" title={archivePath}>
                      Selected:{' '}
                      <code className="rounded bg-background px-1.5 py-0.5 font-mono text-foreground">
                        {elideMiddle(archivePath, 48)}
                      </code>
                    </p>
                  ) : null}
                  <Separator className="my-1" />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isBusy || blocked || !archivePath || state === 'no-game'}
                      onClick={() => actions.installFromArchive(status)}
                    >
                      <Download aria-hidden="true" />
                      {installed ? 'Update from this file' : 'Install from this file'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => actions.setManualOpen(mod.id, false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

        </div>
      ) : null}

      {/* ---- actions ---- */}
      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
        {guideOnly ? (
          <Button type="button" size="sm" onClick={() => actions.openExternal(guideUrl)}>
            <BookOpen aria-hidden="true" />
            Open guide
          </Button>
        ) : state === 'no-game' ? (
          <Button type="button" size="sm" onClick={() => actions.locateGame(game.id)}>
            <FolderSearch aria-hidden="true" />
            {locateLabel}
          </Button>
        ) : state === 'update' ? (
          <>
            <Button type="button" size="sm" disabled={isBusy || blocked} onClick={() => actions.update(status)}>
              {busy ? <LoaderCircle className="animate-spin" /> : <RefreshCw aria-hidden="true" />}
              {busy ? BUSY_LABEL[busy] : 'Update'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isBusy || blocked}
              onClick={() => actions.uninstall(status)}
            >
              <Trash2 aria-hidden="true" />
              Uninstall
            </Button>
          </>
        ) : state === 'unmanaged' ? (
          /* Already on disk, so "Install" would be a lie. Which action is
             useful depends on whether the build is known -- and that has to be
             read from `status`, not from a check run in this session, or the
             buttons disagree with the text above them after a restart. */
          <>
            {isBehind ? (
              <Button
                type="button"
                size="sm"
                disabled={isBusy || blocked}
                onClick={() => actions.install(status)}
              >
                {busy ? <LoaderCircle className="animate-spin" /> : <RefreshCw aria-hidden="true" />}
                {busy
                  ? BUSY_LABEL[busy]
                  : `Update to ${latest ? formatVersion(latest.version) : 'the newest release'}`}
              </Button>
            ) : mod.source.kind !== 'manual' && !knownVersion ? (
              <Button
                type="button"
                size="sm"
                disabled={isBusy || blocked}
                onClick={() => actions.identify(status)}
              >
                {busy ? <LoaderCircle className="animate-spin" /> : <RefreshCw aria-hidden="true" />}
                {busy ? BUSY_LABEL[busy] : 'Check version'}
              </Button>
            ) : null}

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isBusy || blocked}
              onClick={() => actions.install(status)}
              title={
                installer
                  ? 'Download the newest release and open its setup again'
                  : 'Reinstall from here so this app can track and remove it'
              }
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <Download aria-hidden="true" />}
              {busy ? BUSY_LABEL[busy] : 'Reinstall'}
            </Button>

            {/* Removing a mod we did not install means deleting only the files
                that still hash-match its release -- see uninstallUnmanaged. */}
            {knownVersion || installer ? (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isBusy || blocked}
                onClick={() => actions.uninstall(status)}
                title={
                  installer
                    ? "Opens the mod's own setup - choose Uninstall there."
                    : "Delete this mod's files. Anything it replaced cannot be restored, because this app holds no backups for it."
                }
              >
                {busy ? <LoaderCircle className="animate-spin" /> : <Trash2 aria-hidden="true" />}
                {busy ? BUSY_LABEL[busy] : 'Uninstall'}
              </Button>
            ) : null}
          </>
        ) : state === 'installed' ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={isBusy || blocked}
            onClick={() => actions.uninstall(status)}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <Trash2 aria-hidden="true" />}
            {busy ? BUSY_LABEL[busy] : 'Uninstall'}
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={isBusy || blocked} onClick={() => actions.install(status)}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Download aria-hidden="true" />}
            {busy ? BUSY_LABEL[busy] : 'Install'}
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => actions.openExternal(mod.homepage)}
        >
          <ExternalLink aria-hidden="true" />
          Open mod page
        </Button>

      </div>
    </section>
  )
}
