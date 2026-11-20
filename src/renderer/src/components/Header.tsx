import type { ReactElement } from 'react'
import { RefreshCw, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import AppUpdateButton from './AppUpdateButton'
import type { FilterMode } from './helpers'

interface HeaderProps {
  query: string
  onQueryChange: (value: string) => void
  filter: FilterMode
  onFilterChange: (value: FilterMode) => void
  onRescan: () => void
  scanning: boolean
  counts: { total: number; installed: number; updates: number }
}

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'installed', label: 'Installed games' },
  { id: 'updates', label: 'Updates' },
]

export default function Header(props: HeaderProps): ReactElement {
  const { query, onQueryChange, filter, onFilterChange, onRescan, scanning, counts } = props

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-tight text-primary-foreground"
            >
              VR
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
                VR Mod Manager
              </h1>
              <p className="truncate text-xs text-muted-foreground">
                {counts.installed} mods installed
                {counts.updates > 0 ? ` · ${counts.updates} with updates` : ''}
              </p>
            </div>
          </div>

          <div className="ml-auto">
            <AppUpdateButton />
          </div>

          <Button type="button" onClick={onRescan} disabled={scanning}>
            <RefreshCw className={scanning ? 'animate-spin' : undefined} aria-hidden="true" />
            {scanning ? 'Scanning...' : 'Re-scan games'}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[16rem] flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search mods or games"
              aria-label="Search mods or games"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="pr-9 pl-9 [&::-webkit-search-cancel-button]:appearance-none"
            />
            {query ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Clear search"
                onClick={() => onQueryChange('')}
                className="absolute top-1/2 right-1 size-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X aria-hidden="true" />
              </Button>
            ) : null}
          </div>

          <ToggleGroup
            type="single"
            variant="outline"
            value={filter}
            onValueChange={(value) => {
              if (value) onFilterChange(value as FilterMode)
            }}
            aria-label="Filter mods"
            className="shrink-0"
          >
            {FILTERS.map((option) => (
              <ToggleGroupItem
                key={option.id}
                value={option.id}
                aria-label={option.label}
                className="gap-2 text-xs data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground"
              >
                {option.label}
                {option.id === 'updates' && counts.updates > 0 ? (
                  <Badge className="h-4 px-1.5 text-[0.625rem] leading-none">
                    {counts.updates}
                  </Badge>
                ) : null}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </header>
  )
}
