import type { ReactElement } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { Maturity } from '../../../shared/types'
import { MATURITY_HINT, MATURITY_LABEL, isCaution } from './helpers'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface MaturityBadgeProps {
  maturity: Maturity
}

/**
 * Colour carries the signal; the caution tiers also get a glyph so the warning
 * survives for anyone who cannot read the hue.
 */
const TONE: Record<Maturity, string> = {
  stable: 'border-ok/40 bg-ok/10 text-ok',
  beta: 'border-primary/40 bg-primary/10 text-primary',
  // Severity climbs stable -> beta -> alpha -> experimental, so the least
  // mature tier takes the more alarming hue: warn is amber, caution is orange.
  alpha: 'border-warn/40 bg-warn/10 text-warn',
  experimental: 'border-caution/40 bg-caution/10 text-caution',
}

export default function MaturityBadge({ maturity }: MaturityBadgeProps): ReactElement {
  const caution = isCaution(maturity)

  const badge = (
    <Badge
      variant="outline"
      className={TONE[maturity]}
      title={caution ? undefined : MATURITY_HINT[maturity]}
    >
      {caution ? <TriangleAlert aria-hidden="true" /> : null}
      {MATURITY_LABEL[maturity]}
    </Badge>
  )

  if (!caution) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{MATURITY_HINT[maturity]}</TooltipContent>
    </Tooltip>
  )
}
