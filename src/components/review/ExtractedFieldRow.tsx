import { useEffect, useId, useRef, useState } from 'react'
import { CircleAlert, CircleX, Eye, EyeOff, Pencil, UserPen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import type { ExtractedField } from '@/data/types'
import { cn } from '@/lib/utils'
import { CitationChip, type CitationSource } from './CitationChip'
import { ConfidenceIndicator } from './ConfidenceIndicator'
import { fieldState, formatIban, maskIban, type FieldCorrection } from './claim-utils'

const valueStyle: Record<NonNullable<ExtractedField['kind']>, string> = {
  text: '',
  money: 'font-mono tabular-nums',
  date: 'tabular-nums',
  code: 'font-mono',
  iban: 'font-mono',
}

const emDash = (
  <>
    <span aria-hidden="true">—</span>
    <span className="sr-only">Not available</span>
  </>
)

function EditCell({
  field,
  initial,
  onSave,
  onCancel,
}: {
  field: ExtractedField
  initial: string
  onSave: (value: string) => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(initial)
  const [invalid, setInvalid] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const errorId = useId()

  useEffect(() => {
    input.current?.focus()
    input.current?.select()
  }, [])

  const save = () => {
    const next = draft.trim()
    if (next === '') {
      setInvalid(true)
      input.current?.focus()
      return
    }
    onSave(next)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        ref={input}
        aria-label={`Edit ${field.label}`}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        value={draft}
        className={cn('h-7 min-w-32 flex-1', field.kind && valueStyle[field.kind])}
        onChange={(e) => {
          setDraft(e.target.value)
          setInvalid(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          } else if (e.key === 'Escape') {
            e.preventDefault()
            onCancel()
          }
        }}
      />
      <Button size="sm" onClick={save}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onCancel}>
        Cancel
      </Button>
      {invalid && (
        <p id={errorId} className="flex basis-full items-center gap-1 text-caption text-status-danger-fg">
          <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          Enter a value
        </p>
      )}
    </div>
  )
}

/**
 * One extracted field as a table row: Field · Value · Confidence · Source · action.
 * States: default, low confidence, missing, agent failed, editing, corrected. The row is a `<tr>`: render it inside a table body.
 * The edit trigger carries `data-edit-trigger={field.id}` so the table can return focus to it after Save/Cancel.
 */
export function ExtractedFieldRow({
  field,
  value,
  correction,
  editing = false,
  revealed = false,
  onEdit,
  onSave,
  onCancel,
  onToggleReveal,
  onOpenCitation,
}: {
  field: ExtractedField
  /** Current value: the agent's, or the handler's correction. */
  value: string | null
  correction?: FieldCorrection
  editing?: boolean
  /** Only for kind 'iban'. */
  revealed?: boolean
  onEdit?: () => void
  onSave?: (value: string) => void
  onCancel?: () => void
  onToggleReveal?: () => void
  onOpenCitation?: (source: CitationSource) => void
}) {
  const state = fieldState(field, value, { editing, corrected: correction !== undefined })
  const isIban = field.kind === 'iban' && value !== null
  const shown = value === null ? null : isIban && !revealed ? maskIban(value) : isIban ? formatIban(value) : value
  const kindStyle = field.kind ? valueStyle[field.kind] : ''
  const emphasised = state === 'low-confidence' || state === 'corrected'

  const revealButton = isIban && (
    <Button
      variant="ghost"
      size="xs"
      aria-pressed={revealed}
      aria-label={`${revealed ? 'Hide' : 'Reveal'} ${field.label}`}
      onClick={onToggleReveal}
    >
      {revealed ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      {revealed ? 'Hide' : 'Reveal'}
    </Button>
  )

  return (
    <TableRow className={cn('h-row', state === 'low-confidence' && 'bg-status-warning-bg hover:bg-status-warning-bg')}>
      <th
        scope="row"
        title={field.label}
        className={cn('w-28 max-w-44 truncate px-2 py-1 text-left text-body align-middle text-fg', emphasised ? 'font-medium' : 'font-normal')}
      >
        {field.label}
      </th>

      <TableCell className="min-w-48 px-2 py-1 whitespace-normal">
        {state === 'editing' ? (
          <EditCell field={field} initial={value ?? ''} onSave={(v) => onSave?.(v)} onCancel={() => onCancel?.()} />
        ) : state === 'missing' ? (
          <span className="inline-flex items-center gap-2 text-body text-fg-muted">
            {emDash}
            <Badge variant="outline" className="font-semibold">
              <CircleAlert aria-hidden="true" />
              Missing
            </Badge>
          </span>
        ) : state === 'agent-failed' ? (
          <span className="inline-flex items-center gap-2 text-body text-fg-muted">
            {emDash}
            <span className="inline-flex items-center gap-1 font-medium text-status-danger-fg">
              <CircleX aria-hidden="true" className="size-3 shrink-0" />
              Agent failed
            </span>
          </span>
        ) : state === 'corrected' && correction ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={cn('max-w-80 min-w-0 truncate text-body font-medium text-fg', kindStyle)} title={shown ?? undefined}>
                {shown}
              </span>
              {revealButton}
            </div>
            {correction.original === null ? (
              <span className="text-caption text-fg-muted">Agent found no value</span>
            ) : (
              <s className={cn('text-caption text-fg-muted', kindStyle)}>
                <span className="sr-only">Agent value: </span>
                {isIban && !revealed ? maskIban(correction.original) : correction.original}
              </s>
            )}
            <span className="text-caption text-fg-muted">
              Edited by {correction.by} · <span className="tabular-nums">{correction.time}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={cn('max-w-80 min-w-0 truncate text-body text-fg', kindStyle, emphasised && 'font-medium')} title={shown ?? undefined}>
              {shown}
            </span>
            {revealButton}
          </div>
        )}
      </TableCell>

      <TableCell className="w-32 px-2 py-1 text-right whitespace-nowrap">
        {state === 'corrected' ? (
          <Badge variant="secondary" className="font-semibold">
            <UserPen aria-hidden="true" />
            Corrected
          </Badge>
        ) : (
          <ConfidenceIndicator score={value === null ? null : field.confidence} />
        )}
      </TableCell>

      {state === 'agent-failed' ? (
        <TableCell colSpan={2} className="px-2 py-1 text-right">
          <span className="inline-flex items-center justify-end gap-cell">
            <span className="text-body text-fg-muted">{emDash}</span>
            <Button variant="outline" size="sm" data-edit-trigger={field.id} onClick={onEdit}>
              Enter value
              <span className="sr-only"> for {field.label}</span>
            </Button>
          </span>
        </TableCell>
      ) : (
        <>
          <TableCell className="w-32 px-2 py-1 whitespace-nowrap">
            {field.source && state !== 'missing' ? (
              <CitationChip source={field.source} onOpen={onOpenCitation} />
            ) : (
              <span className="text-body text-fg-muted">{emDash}</span>
            )}
          </TableCell>
          <TableCell className="w-11 px-2 py-1 text-center">
            {state !== 'editing' && (
              <Button variant="ghost" size="icon-sm" aria-label={`Correct ${field.label}`} data-edit-trigger={field.id} onClick={onEdit}>
                <Pencil aria-hidden="true" />
              </Button>
            )}
          </TableCell>
        </>
      )}
    </TableRow>
  )
}
