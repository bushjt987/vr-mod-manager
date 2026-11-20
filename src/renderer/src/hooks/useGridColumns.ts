import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * How many columns the grid is currently rendering.
 *
 * The expanding-row layout has to know where each row ends, so the detail panel
 * can be inserted after the last tile in the selected tile's row. Rather than
 * duplicate the grid's breakpoint maths in JavaScript -- which would silently
 * drift the moment the CSS changes -- read the resolved `grid-template-columns`
 * back off the element. That stays correct however the grid is defined.
 */
export function useGridColumns(ref: RefObject<HTMLElement | null>): number {
  const [columns, setColumns] = useState(1)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    const measure = (): void => {
      // Resolved values look like "320px 320px 320px", so the track count is
      // the number of space-separated parts. `none` (not a grid yet) falls
      // back to a single column.
      const template = getComputedStyle(element).gridTemplateColumns
      if (!template || template === 'none') {
        setColumns(1)
        return
      }
      const count = template.split(' ').filter((part) => part.trim().length > 0).length
      setColumns(Math.max(1, count))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return columns
}
