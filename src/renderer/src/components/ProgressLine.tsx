import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { CircleCheck, TriangleAlert } from 'lucide-react'
import type { Progress as ProgressState } from '../../../shared/types'
import { progressLabel, progressPercent } from './helpers'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressLineProps {
  progress: ProgressState
}

/** Endpoints of the sweep used for phases that cannot report a percentage. */
const SWEEP_LOW = 12
const SWEEP_HIGH = 88

/**
 * `downloading` with a known total is the only phase that can show a real
 * percentage. `resolving`, `extracting`, `copying` and `waiting` have no number
 * to show, so the bar sweeps back and forth instead -- shadcn's Progress has no
 * indeterminate mode, so the movement comes from an animated value.
 */
export default function ProgressLine({ progress }: ProgressLineProps): ReactElement {
  const percent = progressPercent(progress)
  const determinate = percent !== null
  const phase = progress.phase
  const sweeping =
    phase === 'resolving' || phase === 'extracting' || phase === 'copying' || phase === 'waiting'

  const [sweep, setSweep] = useState(SWEEP_LOW)

  useEffect(() => {
    if (!sweeping) return
    const timer = setInterval(() => {
      setSweep((current) => (current === SWEEP_LOW ? SWEEP_HIGH : SWEEP_LOW))
    }, 750)
    return () => clearInterval(timer)
  }, [sweeping])

  const label = progressLabel(progress)
  const value = determinate ? percent : sweeping ? sweep : 100

  return (
    <div className="flex flex-col gap-1.5">
      <Progress
        value={value}
        aria-label={label}
        className={cn(
          'h-1.5 bg-secondary',
          phase === 'error' && '[&>[data-slot=progress-indicator]]:bg-destructive',
          phase === 'done' && '[&>[data-slot=progress-indicator]]:bg-ok',
          sweeping &&
            '[&>[data-slot=progress-indicator]]:bg-primary/70 [&>[data-slot=progress-indicator]]:duration-700 [&>[data-slot=progress-indicator]]:ease-in-out',
        )}
      />
      <div className="flex items-start justify-between gap-3 text-xs">
        <span
          className={cn(
            'flex min-w-0 items-center gap-1.5 break-words',
            phase === 'error'
              ? 'text-destructive'
              : phase === 'done'
                ? 'text-ok'
                : 'text-muted-foreground',
          )}
        >
          {phase === 'error' ? <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" /> : null}
          {phase === 'done' ? <CircleCheck className="size-3.5 shrink-0" aria-hidden="true" /> : null}
          {label}
        </span>
        {determinate ? (
          <span className="shrink-0 font-medium tabular-nums text-foreground">
            {Math.round(percent)}%
          </span>
        ) : null}
      </div>
    </div>
  )
}
