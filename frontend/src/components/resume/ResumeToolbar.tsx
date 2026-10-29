import { Download, FileText, RefreshCw, Share2, Star } from 'lucide-react'
import { useRef } from 'react'

import { formatDate } from '../../utils/format'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

type ResumeToolbarProps = {
  filename: string
  text: string | null
  createdAt: string
  isPrimary?: boolean
  settingPrimary?: boolean
  onReplace: (file: File) => void
  onSetPrimary?: () => void
}

export function ResumeToolbar({
  filename,
  text,
  createdAt,
  isPrimary = false,
  settingPrimary = false,
  onReplace,
  onSetPrimary,
}: ResumeToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const wordCount = text?.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <section className="cyber-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent cyber-chamfer-sm">
            <FileText className="h-5 w-5 cyber-icon" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-semibold text-cyber-fg">
              {filename}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              {isPrimary ? <Badge variant="accent">Primary</Badge> : null}
              <p className="font-label text-[10px] uppercase tracking-[0.2em] text-cyber-muted-fg">
                Uploaded {formatDate(createdAt)}
                {wordCount > 0 ? ` · ${wordCount} words parsed` : ' · no text parsed'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {onSetPrimary && !isPrimary ? (
            <Button
              type="button"
              variant="glitch"
              size="sm"
              loading={settingPrimary}
              disabled={settingPrimary}
              leftIcon={<Star className="h-3.5 w-3.5 cyber-icon" strokeWidth={1.5} />}
              onClick={onSetPrimary}
            >
              Set as primary
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-3.5 w-3.5 cyber-icon" strokeWidth={1.5} />}
            onClick={() => {
              const blob = new Blob([text ?? ''], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = filename.replace(/\.pdf$/i, '') + '-extract.txt'
              a.click()
              URL.revokeObjectURL(url)
            }}
          >
            Download
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5 cyber-icon" strokeWidth={1.5} />}
            onClick={() => inputRef.current?.click()}
          >
            Replace
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Share2 className="h-3.5 w-3.5 cyber-icon" strokeWidth={1.5} />}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href)
              } catch {
                /* clipboard unavailable */
              }
            }}
          >
            Share
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onReplace(file)
            }}
          />
        </div>
      </div>
    </section>
  )
}
