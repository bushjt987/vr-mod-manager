import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { AlertTriangle, PackageOpen } from 'lucide-react'
import type { ModStatus, Progress } from '../../shared/types'
import type { IdentifyOutcome, InstallRequest, ProgressEvent, VrmmApi } from '../../shared/api'
import Header from './components/Header'
import GameDetails from './components/GameDetails'
import GameGrid from './components/GameGrid'
import type { GameGroup } from './components/GameGrid'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
  defaultOptionIds,
  errorMessage,
  hasUpdate,
  isGuideOnly,
  modState,
} from './components/helpers'
import type { BusyKind, FilterMode, ModActions } from './components/helpers'

/**
 * The preload bridge is always installed at runtime, but the renderer is
 * deliberately tolerant of it being missing or half-built so that a broken
 * main process shows an error banner instead of a white window.
 */
function getApi(): VrmmApi | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window).vrmm as VrmmApi | undefined
}

function omitKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  if (!(key in record)) return record
  const next = { ...record }
  delete next[key]
  return next
}

/** Placeholder cards shown while the first catalog read is in flight. */
function LoadingSkeleton(): ReactElement {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading the mod catalog">
      {[0, 1, 2].map((index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function App(): ReactElement {
  const [statuses, setStatuses] = useState<ModStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [bridgeError, setBridgeError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterMode>('all')
  /** Which game tile has its detail panel open, or null when all are collapsed. */
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)

  const [progress, setProgress] = useState<Record<string, Progress>>({})
  const [busy, setBusy] = useState<Record<string, BusyKind>>({})
  const [modErrors, setModErrors] = useState<Record<string, string>>({})
  const [gameErrors, setGameErrors] = useState<Record<string, string>>({})
  /** Games whose launch request is still in flight, so Play cannot be double-fired. */
  const [launching, setLaunching] = useState<Record<string, true>>({})

  const [optionOverrides, setOptionOverrides] = useState<Record<string, string[]>>({})
  const [archives, setArchives] = useState<Record<string, string>>({})
  const [manualOpen, setManualOpen] = useState<Record<string, boolean>>({})
  /** Checksum results for hand-installed mods, keyed by mod id. */
  const [identified, setIdentified] = useState<Record<string, IdentifyOutcome>>({})

  const refresh = useCallback(async (): Promise<void> => {
    const api = getApi()
    if (!api || typeof api.listStatuses !== 'function') {
      setBridgeError('The app shell (window.vrmm) is not available yet, so nothing can be loaded.')
      setLoading(false)
      return
    }
    try {
      const next = await api.listStatuses()
      setStatuses(Array.isArray(next) ? next : [])
      setBridgeError(null)
    } catch (err) {
      setBridgeError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /* ---------- progress stream ---------- */

  useEffect(() => {
    const api = getApi()
    if (!api || typeof api.onProgress !== 'function') return

    let unsubscribe: (() => void) | undefined
    try {
      unsubscribe = api.onProgress((event: ProgressEvent) => {
        if (!event || typeof event.modId !== 'string' || !event.progress) return
        const modId = event.modId
        const phase = event.progress

        if (phase.phase === 'error') {
          setModErrors((prev) => ({ ...prev, [modId]: phase.message }))
          setProgress((prev) => omitKey(prev, modId))
          setBusy((prev) => omitKey(prev, modId))
          return
        }

        if (phase.phase === 'done') {
          setProgress((prev) => omitKey(prev, modId))
          setBusy((prev) => omitKey(prev, modId))
          void refresh()
          return
        }

        setProgress((prev) => ({ ...prev, [modId]: phase }))
      })
    } catch (err) {
      setBridgeError(errorMessage(err))
    }

    return () => {
      try {
        unsubscribe?.()
      } catch {
        /* the bridge is going away anyway */
      }
    }
  }, [refresh])

  /* ---------- derived data ---------- */

  const optionsByMod = useMemo<Record<string, string[]>>(() => {
    const map: Record<string, string[]> = {}
    for (const status of statuses) {
      const override = optionOverrides[status.mod.id]
      if (override) map[status.mod.id] = override
      else if (status.installed) map[status.mod.id] = status.installed.options ?? []
      else map[status.mod.id] = defaultOptionIds(status.mod)
    }
    return map
  }, [statuses, optionOverrides])

  const counts = useMemo(() => {
    let installed = 0
    let updates = 0

    for (const status of statuses) {
      const state = modState(status)
      // Present on disk counts as installed, whether or not we put it there.
      if (state === 'installed' || state === 'update' || state === 'unmanaged') installed += 1
      if (hasUpdate(status)) updates += 1
    }

    return { total: statuses.length, installed, updates }
  }, [statuses])

  /**
   * Visible mods, grouped into one entry per game -- the grid shows games, and
   * a game's mods live in the panel that expands beneath it. Filtering applies
   * to mods, so a game appears whenever at least one of its mods matches.
   */
  const groups = useMemo<GameGroup[]>(() => {
    const needle = query.trim().toLowerCase()
    const map = new Map<string, GameGroup>()

    for (const status of statuses) {
      // "Installed" filters on the GAME being on this PC, not on whether any
      // of its mods are installed -- otherwise a freshly detected game with no
      // mods yet would be hidden from the one view meant to show what you own.
      if (filter === 'installed' && !status.detected) continue
      if (filter === 'updates' && !hasUpdate(status)) continue
      if (needle) {
        const haystack = (
          status.mod.name +
          ' ' +
          status.game.name +
          ' ' +
          status.mod.author
        ).toLowerCase()
        if (!haystack.includes(needle)) continue
      }

      const group = map.get(status.game.id)
      if (group) {
        group.statuses.push(status)
      } else {
        map.set(status.game.id, {
          game: status.game,
          detected: status.detected,
          statuses: [status],
        })
      }
    }

    // A-Z by game name. `numeric` keeps "BioShock 2" next to its siblings
    // instead of sorting digits lexically, and `base` sensitivity ignores case
    // and accents so ordering matches what the tiles actually read.
    return Array.from(map.values()).sort((a, b) =>
      a.game.name.localeCompare(b.game.name, undefined, { numeric: true, sensitivity: 'base' }),
    )
  }, [statuses, query, filter])

  /* ---------- actions ---------- */

  const runInstall = useCallback(
    async (status: ModStatus, kind: BusyKind, archivePath?: string): Promise<void> => {
      const modId = status.mod.id
      const api = getApi()
      if (!api || typeof api.install !== 'function') {
        setModErrors((prev) => ({ ...prev, [modId]: 'The installer bridge is unavailable.' }))
        return
      }

      const request: InstallRequest = archivePath
        ? { modId, options: optionsByMod[modId] ?? defaultOptionIds(status.mod), archivePath }
        : { modId, options: optionsByMod[modId] ?? defaultOptionIds(status.mod) }

      setModErrors((prev) => omitKey(prev, modId))
      setBusy((prev) => ({ ...prev, [modId]: kind }))

      try {
        const result = await api.install(request)
        if (!result) {
          setModErrors((prev) => ({ ...prev, [modId]: 'The installer returned no result.' }))
        } else if (!result.ok) {
          setModErrors((prev) => ({ ...prev, [modId]: result.error }))
        } else {
          setManualOpen((prev) => omitKey(prev, modId))
        }
      } catch (err) {
        setModErrors((prev) => ({ ...prev, [modId]: errorMessage(err) }))
      } finally {
        setBusy((prev) => omitKey(prev, modId))
        setProgress((prev) => omitKey(prev, modId))
        await refresh()
      }
    },
    [optionsByMod, refresh],
  )

  const runUninstall = useCallback(
    async (status: ModStatus): Promise<void> => {
      const modId = status.mod.id
      const api = getApi()
      if (!api || typeof api.uninstall !== 'function') {
        setModErrors((prev) => ({ ...prev, [modId]: 'The installer bridge is unavailable.' }))
        return
      }
      setModErrors((prev) => omitKey(prev, modId))
      setBusy((prev) => ({ ...prev, [modId]: 'uninstall' }))
      try {
        const result = await api.uninstall(modId)
        if (!result) {
          setModErrors((prev) => ({ ...prev, [modId]: 'The uninstaller returned no result.' }))
        } else if (!result.ok) {
          setModErrors((prev) => ({ ...prev, [modId]: result.error }))
        }
      } catch (err) {
        setModErrors((prev) => ({ ...prev, [modId]: errorMessage(err) }))
      } finally {
        setBusy((prev) => omitKey(prev, modId))
        setProgress((prev) => omitKey(prev, modId))
        await refresh()
      }
    },
    [refresh],
  )

  const runRescan = useCallback(async (): Promise<void> => {
    const api = getApi()
    if (!api || typeof api.detectGames !== 'function') {
      setBridgeError('Game detection is unavailable.')
      return
    }
    setScanning(true)
    try {
      await api.detectGames()
      setGameErrors({})
    } catch (err) {
      setBridgeError(errorMessage(err))
    } finally {
      await refresh()
      setScanning(false)
    }
  }, [refresh])

  const runIdentify = useCallback(async (status: ModStatus): Promise<void> => {
    const modId = status.mod.id
    const api = getApi()
    if (!api || typeof api.identify !== 'function') {
      setModErrors((prev) => ({ ...prev, [modId]: 'Version checking is unavailable.' }))
      return
    }

    setModErrors((prev) => omitKey(prev, modId))
    setBusy((prev) => ({ ...prev, [modId]: 'update' }))
    try {
      const result = await api.identify(modId)
      if (result.ok) {
        setIdentified((prev) => ({ ...prev, [modId]: result.value }))
        // The identified build is persisted main-side, so re-reading statuses
        // is what puts it on the tile as well as in the panel.
        await refresh()
      } else {
        setModErrors((prev) => ({ ...prev, [modId]: result.error }))
      }
    } catch (err) {
      setModErrors((prev) => ({ ...prev, [modId]: errorMessage(err) }))
    } finally {
      setBusy((prev) => omitKey(prev, modId))
    }
  }, [refresh])

  const actions = useMemo<ModActions>(() => {
    return {
      install(status: ModStatus): void {
        const mod = status.mod
        if (isGuideOnly(mod)) return
        if (mod.source.kind === 'manual' && !archives[mod.id]) {
          setManualOpen((prev) => ({ ...prev, [mod.id]: true }))
          return
        }
        void runInstall(status, 'install', archives[mod.id])
      },

      installFromArchive(status: ModStatus): void {
        const archivePath = archives[status.mod.id]
        if (!archivePath) return
        void runInstall(status, status.installed ? 'update' : 'install', archivePath)
      },

      update(status: ModStatus): void {
        const mod = status.mod
        if (mod.source.kind === 'manual' && !archives[mod.id]) {
          setManualOpen((prev) => ({ ...prev, [mod.id]: true }))
          return
        }
        void runInstall(status, 'update', archives[mod.id])
      },

      uninstall(status: ModStatus): void {
        void runUninstall(status)
      },

      toggleOption(status: ModStatus, optionId: string, enabled: boolean): void {
        const modId = status.mod.id
        setOptionOverrides((prev) => {
          const installedOptions = status.installed ? status.installed.options ?? [] : undefined
          const current = prev[modId] ?? installedOptions ?? defaultOptionIds(status.mod)
          let next: string[]
          if (enabled) {
            next = current.includes(optionId) ? current : [...current, optionId]
          } else {
            next = current.filter((id) => id !== optionId)
          }
          return { ...prev, [modId]: next }
        })
      },

      identify(status: ModStatus): void {
        void runIdentify(status)
      },

      installGame(gameId: string): void {
        void (async (): Promise<void> => {
          const api = getApi()
          if (!api || typeof api.openGameStore !== 'function') {
            setGameErrors((prev) => ({ ...prev, [gameId]: 'Steam handoff is unavailable.' }))
            return
          }
          try {
            const result = await api.openGameStore(gameId)
            if (result.ok) setGameErrors((prev) => omitKey(prev, gameId))
            else setGameErrors((prev) => ({ ...prev, [gameId]: result.error }))
          } catch (err) {
            setGameErrors((prev) => ({ ...prev, [gameId]: errorMessage(err) }))
          }
        })()
      },

      launchGame(gameId: string): void {
        void (async (): Promise<void> => {
          // Play lives on the tile, where a game-level error has nowhere to
          // show, so a failure opens the panel that does show it.
          const fail = (message: string): void => {
            setGameErrors((prev) => ({ ...prev, [gameId]: message }))
            setSelectedGameId(gameId)
          }
          const api = getApi()
          if (!api || typeof api.launchGame !== 'function') {
            fail('Launching games is unavailable.')
            return
          }
          setLaunching((prev) => ({ ...prev, [gameId]: true }))
          try {
            const result = await api.launchGame(gameId)
            if (result.ok) setGameErrors((prev) => omitKey(prev, gameId))
            else fail(result.error)
          } catch (err) {
            fail(errorMessage(err))
          } finally {
            setLaunching((prev) => omitKey(prev, gameId))
          }
        })()
      },

      chooseArchive(modId: string): void {
        void (async (): Promise<void> => {
          const api = getApi()
          if (!api || typeof api.browseForArchive !== 'function') {
            setModErrors((prev) => ({ ...prev, [modId]: 'The file picker is unavailable.' }))
            return
          }
          try {
            const picked = await api.browseForArchive(modId)
            if (picked) {
              setArchives((prev) => ({ ...prev, [modId]: picked }))
              setModErrors((prev) => omitKey(prev, modId))
            }
          } catch (err) {
            setModErrors((prev) => ({ ...prev, [modId]: errorMessage(err) }))
          }
        })()
      },

      setManualOpen(modId: string, open: boolean): void {
        setManualOpen((prev) => (open ? { ...prev, [modId]: true } : omitKey(prev, modId)))
      },

      locateGame(gameId: string): void {
        void (async (): Promise<void> => {
          const api = getApi()
          if (!api || typeof api.browseForGame !== 'function') {
            setGameErrors((prev) => ({ ...prev, [gameId]: 'The folder picker is unavailable.' }))
            return
          }
          try {
            const result = await api.browseForGame(gameId)
            if (result && !result.ok) {
              setGameErrors((prev) => ({ ...prev, [gameId]: result.error }))
            } else if (result) {
              setGameErrors((prev) => omitKey(prev, gameId))
            }
          } catch (err) {
            setGameErrors((prev) => ({ ...prev, [gameId]: errorMessage(err) }))
          } finally {
            await refresh()
          }
        })()
      },

      rescan(): void {
        void runRescan()
      },

      openExternal(url: string): void {
        void (async (): Promise<void> => {
          const api = getApi()
          if (!api || typeof api.openExternal !== 'function' || !url) return
          try {
            await api.openExternal(url)
          } catch {
            /* failing to open a browser is never worth breaking the UI over */
          }
        })()
      },

      openFolder(target: string): void {
        void (async (): Promise<void> => {
          const api = getApi()
          if (!api || typeof api.openFolder !== 'function' || !target) return
          try {
            await api.openFolder(target)
          } catch {
            /* same */
          }
        })()
      },
    }
  }, [archives, refresh, runIdentify, runInstall, runRescan, runUninstall])

  /* ---------- render ---------- */

  const hasMods = statuses.length > 0

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          onRescan={actions.rescan}
          scanning={scanning}
          counts={counts}
        />

        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
          {bridgeError ? (
            <Alert variant="destructive" className="border-destructive/40">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>Could not reach the app shell</AlertTitle>
              <AlertDescription>
                <p>{bridgeError}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => void refresh()}
                >
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          {loading ? (
            <LoadingSkeleton />
          ) : !hasMods ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
              <PackageOpen className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No mods in the catalog.</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
              <PackageOpen className="size-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Nothing matches the current filter.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery('')
                  setFilter('all')
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <GameGrid
              groups={groups}
              selectedGameId={selectedGameId}
              busy={busy}
              launching={launching}
              onSelect={setSelectedGameId}
              onLaunch={actions.launchGame}
              renderDetails={(group) => (
                <GameDetails
                  game={group.game}
                  detected={group.detected}
                  statuses={group.statuses}
                  gameError={gameErrors[group.game.id]}
                  progress={progress}
                  busy={busy}
                  modErrors={modErrors}
                  optionsByMod={optionsByMod}
                  archives={archives}
                  manualOpen={manualOpen}
                  identified={identified}
                  allStatuses={statuses}
                  actions={actions}
                  onClose={() => setSelectedGameId(null)}
                />
              )}
            />
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
