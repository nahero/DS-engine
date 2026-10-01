import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CircleAlert, Lock, Send } from 'lucide-react'
import { PageHeader } from '@/components/patterns/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { AUTHORITY_LIMIT } from '@/lib/claim-logic'
import { formatMoney } from '@/lib/format'
import type { Claim, ClaimFlag, ClaimStatus } from '@/data/types'
import { ConfidenceIndicator } from '@/components/patterns/ConfidenceIndicator'
import { FlagLabel } from '@/components/patterns/FlagLabel'
import { StatusBadge } from '@/components/patterns/StatusBadge'
import { NBSP } from '@/lib/view-state'

const FINAL: ClaimStatus[] = ['Denied', 'Paid', 'Closed']

type Panel = 'decide' | 'refer' | null

/**
 * Claim number, status, confidence, flag and the handler's decisions.
 * Approve and Refer never fire on one click: each opens an inline confirmation (Refer also needs a reason).
 * Above the authority limit the primary action becomes "Send for senior approval".
 */
export function ClaimHeader({
  claim,
  status,
  flag,
  payable,
  overAuthority,
  sentForSenior = false,
  loading = false,
  onRequestInfo,
  onApprove,
  onSendForSeniorApproval,
  onRefer,
}: {
  claim?: Claim
  status?: ClaimStatus
  flag?: ClaimFlag | null
  /** Amount to pay; null when it can't be calculated yet. */
  payable?: number | null
  overAuthority?: boolean
  sentForSenior?: boolean
  loading?: boolean
  onRequestInfo?: () => void
  onApprove?: () => void
  onSendForSeniorApproval?: () => void
  onRefer?: (reason: string) => void
}) {
  const [panel, setPanel] = useState<Panel>(null)
  const [reason, setReason] = useState('')
  const [reasonInvalid, setReasonInvalid] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const decideTrigger = useRef<HTMLButtonElement>(null)
  const referTrigger = useRef<HTMLButtonElement>(null)
  const decideConfirm = useRef<HTMLButtonElement>(null)
  const reasonInput = useRef<HTMLInputElement>(null)
  const restore = useRef<'decide' | 'refer' | null>(null)
  const panelId = useId()
  const reasonErrorId = useId()

  // Focus follows the panel: into it on open, back to its trigger (or the heading if that's gone) on close.
  useEffect(() => {
    if (panel === 'decide') decideConfirm.current?.focus()
    else if (panel === 'refer') reasonInput.current?.focus()
    else if (restore.current) {
      const trigger = restore.current === 'decide' ? decideTrigger.current : referTrigger.current
      restore.current = null
      ;(trigger ?? heading.current)?.focus()
    }
  }, [panel])

  if (loading || !claim || !status) {
    return (
      <header aria-busy="true" className="flex flex-wrap items-start justify-between gap-stack">
        <div role="status" className="flex flex-col gap-2">
          <span className="sr-only">Loading claim</span>
          <Skeleton aria-hidden="true" className="w-72 text-heading-md">{NBSP}</Skeleton>
          <Skeleton aria-hidden="true" className="w-56 text-body">{NBSP}</Skeleton>
        </div>
        <div aria-hidden="true" className="flex gap-stack">
          <Skeleton className="h-control w-28" />
          <Skeleton className="h-control w-20" />
          <Skeleton className="h-control w-40" />
        </div>
      </header>
    )
  }

  const closePanel = (focus: 'decide' | 'refer') => {
    restore.current = focus
    setPanel(null)
    setReason('')
    setReasonInvalid(false)
  }

  const isFinal = FINAL.includes(status)
  const approved = status === 'Approved'
  const cannotDecide = payable === null && !approved
  const decideLabel = overAuthority ? 'Send for senior approval' : 'Approve'
  const authority = formatMoney(AUTHORITY_LIMIT)

  const submitRefer = (e: FormEvent) => {
    e.preventDefault()
    const text = reason.trim()
    if (text === '') {
      setReasonInvalid(true)
      reasonInput.current?.focus()
      return
    }
    onRefer?.(text)
    closePanel('refer')
  }

  const confirmDecision = () => {
    if (overAuthority) onSendForSeniorApproval?.()
    else onApprove?.()
    closePanel('decide')
  }

  const escape = (focus: 'decide' | 'refer') => (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      closePanel(focus)
    }
  }

  return (
    <header className="flex flex-col gap-stack">
      <PageHeader
        className="items-start"
        title={claim.id}
        titleClassName="font-mono outline-none"
        titleProps={{ ref: heading, tabIndex: -1 }}
        badges={
          <>
            <StatusBadge status={status} />
            <ConfidenceIndicator score={claim.confidence} />
            {flag && <FlagLabel flag={flag} />}
          </>
        }
        subtitle={`${claim.policyholder} · ${claim.lob} claim`}
        actions={
        <div className="flex flex-col items-start gap-1 sm:items-end">
          {isFinal ? (
            <p className="flex items-center gap-2 text-body text-fg-muted">
              <Lock aria-hidden="true" className="size-4 shrink-0" />
              This claim is {status.toLowerCase()}. No further actions are available.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {status !== 'Info requested' && (
                  <Button variant="outline" onClick={onRequestInfo}>
                    Request info
                  </Button>
                )}
                <Button
                  ref={referTrigger}
                  variant="secondary"
                  aria-expanded={panel === 'refer'}
                  aria-controls={panel === 'refer' ? panelId : undefined}
                  onClick={() => setPanel(panel === 'refer' ? null : 'refer')}
                >
                  Refer
                </Button>
                {sentForSenior ? (
                  <Button disabled>
                    <Send aria-hidden="true" />
                    Sent for senior approval
                  </Button>
                ) : (
                  !approved && (
                    <Button
                      ref={decideTrigger}
                      disabled={cannotDecide}
                      aria-expanded={panel === 'decide'}
                      aria-controls={panel === 'decide' ? panelId : undefined}
                      onClick={() => setPanel(panel === 'decide' ? null : 'decide')}
                    >
                      {overAuthority && <Send aria-hidden="true" />}
                      {decideLabel}
                    </Button>
                  )
                )}
              </div>
              {sentForSenior ? (
                <p className="text-caption text-fg-muted">Waiting for a senior handler to decide</p>
              ) : cannotDecide ? (
                <p className="text-caption text-fg-muted">Can’t approve until the payout can be calculated</p>
              ) : (
                overAuthority && !approved && <p className="text-caption text-fg-muted">Needs senior approval above {authority}</p>
              )}
            </>
          )}
        </div>
        }
      />

      {panel === 'decide' && (
        <div
          id={panelId}
          role="group"
          aria-labelledby={`${panelId}-title`}
          onKeyDown={escape('decide')}
          className="flex flex-wrap items-center justify-between gap-stack rounded-surface border bg-surface p-inset"
        >
          <div className="flex min-w-0 flex-1 basis-72 flex-col gap-0.5">
            <p id={`${panelId}-title`} className="text-body font-medium text-fg">
              {overAuthority ? 'Send for senior approval?' : 'Approve this claim?'}
            </p>
            <p className="text-caption text-fg-muted">
              {overAuthority
                ? `Payable ${formatMoney(payable ?? 0)} is above your authority limit (${authority}). A senior handler will decide. This is recorded in the audit trail.`
                : `Payable ${formatMoney(payable ?? 0)} will be approved. This is recorded in the audit trail.`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button ref={decideConfirm} onClick={confirmDecision}>
              {overAuthority ? 'Confirm and send' : 'Confirm approval'}
            </Button>
            <Button variant="ghost" onClick={() => closePanel('decide')}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {panel === 'refer' && (
        <form
          id={panelId}
          aria-labelledby={`${panelId}-title`}
          onSubmit={submitRefer}
          onKeyDown={escape('refer')}
          noValidate
          className="flex flex-col gap-2 rounded-surface border bg-surface p-inset"
        >
          <p id={`${panelId}-title`} className="text-body font-medium text-fg">
            Refer this claim
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1">
              <label htmlFor={`${panelId}-reason`} className="text-caption text-fg-muted">
                Reason for referral (required)
              </label>
              <Input
                id={`${panelId}-reason`}
                ref={reasonInput}
                value={reason}
                required
                aria-invalid={reasonInvalid || undefined}
                aria-describedby={reasonInvalid ? reasonErrorId : undefined}
                onChange={(e) => {
                  setReason(e.target.value)
                  setReasonInvalid(false)
                }}
              />
              {reasonInvalid && (
                <p id={reasonErrorId} className="flex items-center gap-1 text-caption text-status-danger-fg">
                  <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
                  Enter a reason to refer this claim
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Button type="submit">Refer claim</Button>
              <Button type="button" variant="ghost" onClick={() => closePanel('refer')}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}
    </header>
  )
}
