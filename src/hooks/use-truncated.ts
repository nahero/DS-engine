import { useLayoutEffect, useState, type RefObject } from 'react'

/** True while the element's text is cut off by `truncate` (re-measured on resize). */
export function useIsTruncated(ref: RefObject<HTMLElement | null>, text?: string) {
  const [truncated, setTruncated] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, text])
  return truncated
}
