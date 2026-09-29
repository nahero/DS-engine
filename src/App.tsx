import * as React from 'react'
import { Construction } from 'lucide-react'

import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
import { ClaimDetail } from '@/screens/ClaimDetail'
import { ClaimsQueue } from '@/screens/ClaimsQueue'
import { Overview } from '@/screens/Overview'

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
    <div className="flex flex-col items-center justify-center gap-stack p-inset py-24 text-center">
      <Construction aria-hidden className="size-8 text-fg-muted" />
      <h1 className="text-heading-lg font-semibold">{title}</h1>
      <p className="max-w-prose text-body text-fg-muted">Not built yet. The Overview is the first screen of this concept.</p>
      <Button asChild variant="outline">
        <a href="#overview">Back to Overview</a>
      </Button>
    </div>
  )
}

export default function App() {
  const { page, claimId } = useRoute()
  const isClaim = page === 'claim-detail' && claimId !== undefined
  const meta = isClaim ? { section: 'Claims', title: claimId } : PAGES[page]
  const breadcrumb = isClaim
    ? [{ label: 'Claims' }, { label: 'Queue', href: '#claims-queue' }, { label: claimId }]
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
      {isClaim ? (
        <ClaimDetail claimId={claimId} />
      ) : page === 'overview' ? (
        <Overview />
      ) : page === 'claims-queue' ? (
        <ClaimsQueue />
      ) : (
        <ComingSoon title={meta.title} />
      )}
    </AppShell>
  )
}
