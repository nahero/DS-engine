import { useEffect, useRef } from 'react'
import { FileText, Quote } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { ClaimDocument } from '@/data/types'
import { cn } from '@/lib/utils'

export interface DocumentHighlight {
  docId: string
  page: number
  /** Changes on every citation click so a repeat click on the same document moves focus again. */
  nonce: number
}

/** Documents received for the claim. A cited document is highlighted (and labelled) and receives focus when `highlight` changes. */
export function DocumentList({ documents, highlight }: { documents: ClaimDocument[]; highlight?: DocumentHighlight | null }) {
  const cited = useRef<HTMLLIElement>(null)
  const nonce = highlight?.nonce

  useEffect(() => {
    if (nonce !== undefined) cited.current?.focus()
  }, [nonce])

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-6 text-center">
        <FileText aria-hidden="true" className="size-5 text-fg-muted" />
        <p className="text-body font-medium text-fg">No documents received</p>
        <p className="text-caption text-fg-muted">Documents appear here once the policyholder submits them</p>
      </div>
    )
  }

  return (
    <ul>
      {documents.map((doc) => {
        const isCited = highlight?.docId === doc.id
        return (
          <li
            key={doc.id}
            id={`doc-${doc.id}`}
            ref={isCited ? cited : undefined}
            tabIndex={isCited ? -1 : undefined}
            aria-current={isCited ? 'true' : undefined}
            className={cn(
              'flex min-h-row flex-wrap items-center gap-x-stack gap-y-1 border-b border-border px-cell py-2 outline-none last:border-b-0 focus-visible:ring-3 focus-visible:ring-ring',
              isCited && 'border border-citation-border bg-citation-bg',
            )}
          >
            <FileText aria-hidden="true" className="size-4 shrink-0 text-fg-muted" />
            <span className="min-w-0 flex-1 basis-40 truncate text-body font-medium text-fg" title={doc.name}>
              {doc.name}
            </span>
            {isCited && (
              <span className="inline-flex shrink-0 items-center gap-1 text-caption font-medium text-fg">
                <Quote aria-hidden="true" className="size-3.5" />
                Cited on p.{highlight.page}
              </span>
            )}
            <span className="w-24 shrink-0 text-caption text-fg-muted">{doc.type}</span>
            <span className="w-16 shrink-0 text-caption text-fg-muted tabular-nums">
              {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
            </span>
            <span className="w-36 shrink-0 text-caption text-fg-muted tabular-nums">Received {formatDate(doc.receivedAt)}</span>
          </li>
        )
      })}
    </ul>
  )
}
