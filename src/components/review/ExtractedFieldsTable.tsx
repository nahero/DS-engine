import { useEffect, useMemo, useRef } from 'react'
import { FileSearch } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { TableBody, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { ExtractedField } from '@/data/types'
import type { CitationSource } from './CitationChip'
import { ExtractedFieldRow } from './ExtractedFieldRow'
import { sortFields, type FieldCorrection } from './claim-utils'
import { NBSP } from './shared'

const SKELETON_ROWS = 7

const th = 'h-row px-2 py-1 text-left text-caption font-medium whitespace-nowrap text-fg-muted'

/**
 * Extracted fields, needs-attention first. The table scrolls inside its own labelled, focusable region on narrow screens.
 * After an edit ends, focus returns to that row's edit button.
 */
export function ExtractedFieldsTable({
  fields,
  values,
  corrections,
  editingId,
  revealedIds,
  loading = false,
  onEdit,
  onSave,
  onCancel,
  onToggleReveal,
  onOpenCitation,
}: {
  fields: ExtractedField[]
  /** Current value per field id (agent value or correction). */
  values: Record<string, string | null>
  corrections: Record<string, FieldCorrection>
  editingId: string | null
  revealedIds: string[]
  loading?: boolean
  onEdit: (id: string) => void
  onSave: (id: string, value: string) => void
  onCancel: () => void
  onToggleReveal: (id: string) => void
  onOpenCitation: (source: CitationSource) => void
}) {
  const sorted = useMemo(() => sortFields(fields), [fields])
  const region = useRef<HTMLDivElement>(null)
  // Set when an edit starts; when it ends, focus goes back to that row's edit button.
  const returnFocusTo = useRef<string | null>(null)

  useEffect(() => {
    if (editingId !== null) {
      returnFocusTo.current = editingId
    } else if (returnFocusTo.current !== null) {
      const id = returnFocusTo.current
      returnFocusTo.current = null
      region.current?.querySelector<HTMLElement>(`[data-edit-trigger="${CSS.escape(id)}"]`)?.focus()
    }
  }, [editingId])

  return (
    <div
      ref={region}
      role="region"
      aria-label="Extracted fields"
      tabIndex={0}
      aria-busy={loading || undefined}
      className="relative overflow-x-auto rounded-inner outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <table className="w-full min-w-160 border-collapse text-body">
        <caption className="sr-only">Extracted fields, missing and low confidence first</caption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <th scope="col" className={th}>
              Field
            </th>
            <th scope="col" className={th}>
              Value
            </th>
            <th scope="col" className={cn(th, 'text-right')}>
              Confidence
            </th>
            <th scope="col" className={th}>
              Source
            </th>
            <th scope="col" className={th}>
              <span className="sr-only">Actions</span>
            </th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: SKELETON_ROWS }, (_, i) => (
              <TableRow key={i} aria-hidden="true" className="h-row hover:bg-transparent">
                <td className="px-2 py-1">
                  <Skeleton className="w-24 text-body">{NBSP}</Skeleton>
                </td>
                <td className="px-2 py-1">
                  <Skeleton className="w-40 text-body">{NBSP}</Skeleton>
                </td>
                <td className="px-2 py-1">
                  <Skeleton className="ml-auto w-24 text-caption">{NBSP}</Skeleton>
                </td>
                <td className="px-2 py-1">
                  <Skeleton className="w-24 text-caption">{NBSP}</Skeleton>
                </td>
                <td className="px-2 py-1">
                  <Skeleton className="mx-auto size-7" />
                </td>
              </TableRow>
            ))
          ) : (
            sorted.map((field) => (
              <ExtractedFieldRow
                key={field.id}
                field={field}
                value={values[field.id] ?? null}
                correction={corrections[field.id]}
                editing={editingId === field.id}
                revealed={revealedIds.includes(field.id)}
                onEdit={() => onEdit(field.id)}
                onSave={(v) => onSave(field.id, v)}
                onCancel={onCancel}
                onToggleReveal={() => onToggleReveal(field.id)}
                onOpenCitation={onOpenCitation}
              />
            ))
          )}
        </TableBody>
      </table>
      {!loading && fields.length === 0 && (
        <div className="flex flex-col items-center gap-1 py-6 text-center">
          <FileSearch aria-hidden="true" className="size-5 text-fg-muted" />
          <p className="text-body font-medium text-fg">No fields extracted</p>
          <p className="text-caption text-fg-muted">The agent found nothing to extract from the submitted documents</p>
        </div>
      )}
    </div>
  )
}
