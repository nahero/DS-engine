import { useMemo, useRef, useState } from 'react'
import { SearchX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/app/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AUTHORITY_LIMIT, getClaimDetail } from '@/data/claim-detail'
import { currentUser } from '@/data/current-user'
import { formatMoney } from '@/data/claims'
import type { Actor, AuditEvent, ClaimDetail as ClaimDetailData, ClaimFlag, ClaimStatus } from '@/data/types'
import { AgentSummary } from '@/components/review/AgentSummary'
import { AuditTrail } from '@/components/review/AuditTrail'
import type { CitationSource } from '@/components/review/CitationChip'
import { ClaimHeader } from '@/components/review/ClaimHeader'
import { ClaimSummary } from '@/components/review/ClaimSummary'
import { CoverageChecks } from '@/components/review/CoverageChecks'
import { DocumentList, type DocumentHighlight } from '@/components/review/DocumentList'
import { ExtractedFieldsTable } from '@/components/review/ExtractedFieldsTable'
import { PayoutBreakdown } from '@/components/review/PayoutBreakdown'
import { StateBlock } from '@/components/review/StateBlock'
import type { ViewState } from '@/components/review/shared'
import { routes } from '@/lib/routes'
import { derivePayout, maskIban, type FieldCorrection } from '@/components/review/claim-utils'

export type ClaimDetailState = Extract<ViewState, 'default' | 'loading' | 'error'>

/** The signed-in handler: author of every action on this screen. */
const ME = { kind: 'person', name: currentUser.name } as const satisfies Actor

type TabId = 'fields' | 'documents' | 'coverage' | 'audit'

/** Local date-time as ISO without offset, like the mock audit data. */
function nowIso(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const pageClass = 'flex flex-col gap-stack p-inset'

/** Claim detail: header and decisions, key facts, extracted fields with citations, payout, agent summary, audit trail. */
export function ClaimDetail({ claimId, state = 'default' }: { claimId: string; state?: ClaimDetailState }) {
  const [retried, setRetried] = useState(false)
  const view = retried ? 'default' : state

  if (view === 'loading') return <LoadingView />
  if (view === 'error') {
    return (
      <div className={pageClass}>
        <PageHeader title={claimId} titleClassName="font-mono" />
        <StateBlock
          kind="error"
          framed
          title={`Couldn’t load claim ${claimId}`}
          description="The claim didn’t load. Check your connection and try again."
          action={
            <Button variant="outline" size="sm" onClick={() => setRetried(true)}>
              Retry
            </Button>
          }
        />
      </div>
    )
  }

  const detail = getClaimDetail(claimId)
  if (!detail) {
    return (
      <div className={pageClass}>
        <PageHeader title="Claim not found" />
        <StateBlock
          kind="empty"
          framed
          icon={SearchX}
          title={`No claim ${claimId}`}
          description="It may have been removed, or the number may be mistyped."
          action={
            <Button asChild variant="outline">
              <a href={routes.queue}>Back to queue</a>
            </Button>
          }
        />
      </div>
    )
  }

  // Keyed so navigating between claims starts from that claim's own data.
  return <ClaimDetailBody key={detail.claim.id} detail={detail} />
}

function LoadingView() {
  return (
    <div className={pageClass}>
      <ClaimHeader loading />
      <ClaimSummary loading />
      <div className="grid grid-cols-1 gap-stack lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card aria-busy="true">
            <CardContent className="flex flex-col gap-stack">
              <Skeleton aria-hidden="true" className="h-control w-full max-w-96" />
              <ExtractedFieldsTable
                loading
                fields={[]}
                values={{}}
                corrections={{}}
                editingId={null}
                revealedIds={[]}
                onEdit={() => {}}
                onSave={() => {}}
                onCancel={() => {}}
                onToggleReveal={() => {}}
                onOpenCitation={() => {}}
              />
            </CardContent>
          </Card>
        </div>
        <div className="flex min-w-0 flex-col gap-stack">
          <PayoutBreakdown loading />
          <AgentSummary loading />
          <AuditTrail events={[]} compact loading />
        </div>
      </div>
    </div>
  )
}

function ClaimDetailBody({ detail }: { detail: ClaimDetailData }) {
  const { claim, fields, documents, coverage, payout, agentSummary } = detail

  const [status, setStatus] = useState<ClaimStatus>(claim.status)
  const [flag, setFlag] = useState<ClaimFlag | null>(claim.flag)
  const [sentForSenior, setSentForSenior] = useState(false)
  const [values, setValues] = useState<Record<string, string | null>>(() => Object.fromEntries(fields.map((f) => [f.id, f.value])))
  const [corrections, setCorrections] = useState<Record<string, FieldCorrection>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<string[]>([])
  const [events, setEvents] = useState<AuditEvent[]>(detail.audit)
  const [announcement, setAnnouncement] = useState('')
  const [tab, setTab] = useState<TabId>('fields')
  const [highlight, setHighlight] = useState<DocumentHighlight | null>(null)
  const counter = useRef(0)

  const derived = useMemo(() => derivePayout(payout), [payout])

  const record = (event: string, eventDetail?: string) => {
    counter.current += 1
    setEvents((prev) => [{ id: `ev-local-${counter.current}`, at: nowIso(), actor: ME, event, detail: eventDetail }, ...prev])
  }

  const shownValue = (id: string, value: string | null) => {
    const field = fields.find((f) => f.id === id)
    if (value === null) return 'no value'
    return field?.kind === 'iban' ? maskIban(value) : value
  }

  // Decisions

  const payableText = formatMoney(derived.payable ?? 0)

  const requestInfo = () => {
    setStatus('Info requested')
    record('Requested info')
    setAnnouncement('Info requested. Status is now Info requested.')
  }

  const approve = () => {
    setStatus('Approved')
    record(`Approved payout ${payableText}`)
    setAnnouncement(`Claim approved. Payout ${payableText}.`)
  }

  const sendForSeniorApproval = () => {
    setSentForSenior(true)
    record('Sent for senior approval', `Payable ${payableText} exceeds ${formatMoney(AUTHORITY_LIMIT)}`)
    setAnnouncement('Sent for senior approval.')
  }

  const refer = (reason: string) => {
    setFlag('Referred for review')
    if (status === 'New') setStatus('In review')
    record('Referred for review', reason)
    setAnnouncement('Claim referred for review.')
  }

  // Fields

  const saveField = (id: string, next: string) => {
    const field = fields.find((f) => f.id === id)
    if (!field) return
    if (next === values[id]) {
      setEditingId(null)
      return
    }
    const original = id in corrections ? corrections[id].original : field.value
    if (next === original) {
      setCorrections(({ [id]: _dropped, ...rest }) => rest)
      setValues((prev) => ({ ...prev, [id]: next }))
      record(`Restored agent value for “${field.label}”`, shownValue(id, next))
    } else {
      setCorrections((prev) => ({ ...prev, [id]: { original, by: ME.name, time: nowIso().slice(11, 16) } }))
      setValues((prev) => ({ ...prev, [id]: next }))
      record(
        `Corrected “${field.label}”`,
        original === null
          ? `Entered ${shownValue(id, next)} (agent found no value)`
          : `${shownValue(id, next)} (agent value: ${shownValue(id, original)})`,
      )
    }
    setEditingId(null)
    setAnnouncement(`${field.label} saved.`)
  }

  const cancelEdit = () => {
    setEditingId(null)
  }

  const toggleReveal = (key: string, label: string, auditLabel: string) => {
    const on = !revealed.includes(key)
    setRevealed((prev) => (on ? [...prev, key] : prev.filter((k) => k !== key)))
    if (on) record(`Revealed ${auditLabel}`)
    setAnnouncement(`${label} ${on ? 'shown' : 'hidden'}.`)
  }

  // Citations

  const openCitation = (source: CitationSource) => {
    const wanted = source.doc.toLowerCase()
    const doc = documents.find((d) => d.type.toLowerCase() === wanted || d.name.toLowerCase() === wanted)
    counter.current += 1
    setTab('documents')
    setHighlight(doc ? { docId: doc.id, page: source.page, nonce: counter.current } : null)
    setAnnouncement(doc ? `Opened ${doc.name}, page ${source.page}.` : `${source.doc} isn’t in the received documents.`)
  }

  const showTab = (next: string) => {
    setTab(next as TabId)
    setHighlight(null)
  }

  return (
    <div className={pageClass}>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      <ClaimHeader
        claim={claim}
        status={status}
        flag={flag}
        payable={derived.payable}
        overAuthority={derived.overAuthority}
        sentForSenior={sentForSenior}
        onRequestInfo={requestInfo}
        onApprove={approve}
        onSendForSeniorApproval={sendForSeniorApproval}
        onRefer={refer}
      />

      <ClaimSummary
        claim={claim}
        policyPeriod={detail.policyPeriod}
        policyRevealed={revealed.includes('policy-number')}
        onToggleReveal={() => toggleReveal('policy-number', 'Policy number', 'policy number')}
      />

      <div className="grid grid-cols-1 gap-stack lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <Card>
            <CardContent>
              <Tabs value={tab} onValueChange={showTab}>
                <TabsList aria-label="Claim sections">
                  <TabsTrigger value="fields">
                    Extracted fields
                    <Badge variant="secondary" className="tabular-nums">
                      {fields.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="documents">
                    Documents
                    <Badge variant="secondary" className="tabular-nums">
                      {documents.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="coverage">Coverage check</TabsTrigger>
                  <TabsTrigger value="audit">Audit trail</TabsTrigger>
                </TabsList>

                <TabsContent value="fields" className="flex flex-col gap-2">
                  <p className="text-caption text-fg-muted">Missing and low-confidence fields first</p>
                  <ExtractedFieldsTable
                    fields={fields}
                    values={values}
                    corrections={corrections}
                    editingId={editingId}
                    revealedIds={revealed}
                    onEdit={setEditingId}
                    onSave={saveField}
                    onCancel={cancelEdit}
                    onToggleReveal={(id) => {
                      const label = fields.find((f) => f.id === id)?.label ?? 'Value'
                      toggleReveal(id, label, label)
                    }}
                    onOpenCitation={openCitation}
                  />
                </TabsContent>
                <TabsContent value="documents">
                  <DocumentList documents={documents} highlight={highlight} />
                </TabsContent>
                <TabsContent value="coverage">
                  <CoverageChecks checks={coverage} />
                </TabsContent>
                <TabsContent value="audit">
                  <AuditTrail events={events} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-stack">
          <PayoutBreakdown payout={payout} />
          <AgentSummary summary={agentSummary} />
          <AuditTrail events={events} compact onViewAll={() => showTab('audit')} />
        </div>
      </div>
    </div>
  )
}

