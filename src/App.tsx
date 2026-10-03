import * as React from 'react'
import { Construction } from 'lucide-react'

import { AppShell } from '@/components/layout/AppShell'
import { PageHeader } from '@/components/patterns/PageHeader'
import { StateBlock } from '@/components/patterns/StateBlock'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { routes } from '@/lib/routes'

// Each screen is its own chunk: the entry only carries the shell, Recharts and the claims data load with their screens.
const loadOverview = () => import('@/screens/Overview').then((m) => ({ default: m.Overview }))
const loadClaimsQueue = () => import('@/screens/ClaimsQueue').then((m) => ({ default: m.ClaimsQueue }))
const loadClaimDetail = () => import('@/screens/ClaimDetail').then((m) => ({ default: m.ClaimDetail }))
const Overview = React.lazy(loadOverview)
const ClaimsQueue = React.lazy(loadClaimsQueue)
const ClaimDetail = React.lazy(loadClaimDetail)

const NBSP = '\u00a0'

const PAGES: Record<string, { section: string; title: string }> = {
  overview: { section: 'Claims', title: 'Overview' },
  'claims-queue': { section: 'Claims', title: 'Claims queue' },
  'my-assigned': { section: 'Claims', title: 'My assigned' },
  referred: { section: 'Claims', title: 'Referred' },
  policies: { section: 'Policies', title: 'Policies' },
  policyholders: { section: 'Policies', title: 'Policyholders' },
  reports: { section: 'Admin', title: 'Reports' },
  settings: { section: 'Admin', title: 'Settings' },
}

type Route = { page: string; claimId?: string }

const CLAIM_PREFIX = 'claim-'

// Sidebar ids and #claim-<id> change the page; other hashes (#main) leave it as is.
function routeFromHash(current: Route): Route {
  const id = decodeURIComponent(window.location.hash.slice(1))
  if (!id) return { page: 'overview' }
  if (id in PAGES) return { page: id }
  if (id.startsWith(CLAIM_PREFIX) && id.length > CLAIM_PREFIX.length) {
    return { page: 'claim-detail', claimId: id.slice(CLAIM_PREFIX.length) }
  }
  return current
}

// Start fetching the first route's chunk while the shell is still booting, instead of after its first render.
const initialLoad = { overview: loadOverview, 'claims-queue': loadClaimsQueue, 'claim-detail': loadClaimDetail }[
  routeFromHash({ page: 'overview' }).page
]
void initialLoad?.()

function useRoute() {
  const [route, setRoute] = React.useState<Route>(() => routeFromHash({ page: 'overview' }))
  React.useEffect(() => {
    const onHashChange = () =>
      setRoute((current) => {
        const next = routeFromHash(current)
        return next.page === current.page && next.claimId === current.claimId ? current : next
      })
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return route
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-stack p-inset">
      <PageHeader title={title} />
      <StateBlock
        kind="empty"
        framed
        icon={Construction}
        title="Not built yet"
        description="The Overview is the first screen of this concept."
        action={
          <Button asChild variant="outline">
            <a href={routes.overview}>Back to Overview</a>
          </Button>
        }
      />
    </div>
  )
}

/** Suspense fallback at the final layout: a page-header-shaped skeleton and one block for the content. */
function PageFallback() {
  return (
    <div className="flex flex-col gap-stack p-inset">
      <div role="status" className="sr-only">
        Loading page
      </div>
      <div aria-hidden="true" className="flex flex-col gap-1">
        <Skeleton className="w-48 text-heading-md">{NBSP}</Skeleton>
        <Skeleton className="w-72 text-body">{NBSP}</Skeleton>
      </div>
      <Skeleton aria-hidden="true" className="h-96 w-full" />
    </div>
  )
}

export default function App() {
  const { page, claimId } = useRoute()
  const isClaim = page === 'claim-detail' && claimId !== undefined
  const meta = isClaim ? { section: 'Claims', title: claimId } : PAGES[page]
  const breadcrumb = isClaim
    ? [{ label: 'Claims' }, { label: 'Queue', href: routes.queue }, { label: claimId }]
    : [{ label: meta.section }, { label: meta.title }]

  // Announce the new page: title, and focus to the main region (not on first load).
  const firstRender = React.useRef(true)
  React.useEffect(() => {
    document.title = `${meta.title} \u00b7 ClaimDesk`
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [page, meta.title])

  return (
    <AppShell activeItem={isClaim ? 'claims-queue' : page} breadcrumb={breadcrumb}>
      <React.Suspense fallback={<PageFallback />}>
        {isClaim ? (
          <ClaimDetail claimId={claimId} />
        ) : page === 'overview' ? (
          <Overview />
        ) : page === 'claims-queue' ? (
          <ClaimsQueue />
        ) : (
          <ComingSoon title={meta.title} />
        )}
      </React.Suspense>
    </AppShell>
  )
}
