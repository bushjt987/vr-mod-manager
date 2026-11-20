import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { Download, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AppUpdateStatus } from '../../../shared/api'

/**
 * The app's own update, in the header. Silent while there is nothing to say:
 * it only shows up while a new build downloads and once it is ready to install.
 */
export default function AppUpdateButton(): ReactElement | null {
  const [status, setStatus] = useState<AppUpdateStatus>({ state: 'unsupported' })

  useEffect(() => {
    const api = window.vrmm
    if (!api || typeof api.onUpdateStatus !== 'function') return

    let active = true
    void api.getUpdateStatus().then((initial) => {
      if (active) setStatus(initial)
    })
    const unsubscribe = api.onUpdateStatus(setStatus)
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  if (status.state === 'downloading') {
    return (
      <Button type="button" variant="outline" disabled>
        <Download aria-hidden="true" />
        Downloading update {status.percent}%
      </Button>
    )
  }

  if (status.state === 'ready') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="secondary" onClick={() => void window.vrmm.installAppUpdate()}>
            <RotateCw aria-hidden="true" />
            Restart to update
          </Button>
        </TooltipTrigger>
        <TooltipContent>Version {status.version} is downloaded. It also installs next time you quit.</TooltipContent>
      </Tooltip>
    )
  }

  return null
}
