import * as React from 'react'
import { Construction } from 'lucide-react'

import { AppShell } from '@/components/app/AppShell'
import { Button } from '@/components/ui/button'
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

// Only sidebar ids change the page; other hashes (#main, #claim-…) leave it as is.
function pageFromHash(current: string) {
  const id = window.location.hash.slice(1)
  if (!id) return 'overview'
  return id in PAGES ? id : current
}

function usePage() {
  const [page, setPage] = React.useState(() => pageFromHash('overview'))
  React.useEffect(() => {
    const onHashChange = () => setPage((current) => pageFromHash(current))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return page
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
  const page = usePage()
  const { section, title } = PAGES[page]
  return (
    <AppShell activeItem={page} breadcrumb={[{ label: section }, { label: title }]}>
      {page === 'overview' ? <Overview /> : <ComingSoon title={title} />}
    </AppShell>
  )
}
