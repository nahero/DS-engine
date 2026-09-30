/** Hash hrefs for in-app navigation. One place, so a router swap touches nothing else. */
export const routes = {
  overview: '#overview',
  queue: '#claims-queue',
  claim: (id: string) => '#claim-' + id,
  /** Any other page by its sidebar id (`#reports`). */
  page: (id: string) => '#' + id,
} as const
