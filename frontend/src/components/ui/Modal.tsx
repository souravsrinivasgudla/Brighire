import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

import { cn } from '../../utils/cn'
import { scaleIn } from './motion'
import { TerminalHeader } from './CyberShell'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/80"
            aria-label="Close dialog"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cyber-modal-title"
            aria-describedby={description ? 'cyber-modal-desc' : undefined}
            className={cn(
              'relative z-10 w-full border border-cyber-border bg-cyber-card shadow-[var(--box-shadow-neon-sm)] cyber-chamfer',
              sizeMap[size],
              className,
            )}
            {...scaleIn}
          >
            <TerminalHeader title="modal.sys" />
            <div className="p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 id="cyber-modal-title" className="cyber-h3 text-lg">
                    {title}
                  </h2>
                  {description ? (
                    <p id="cyber-modal-desc" className="mt-1 font-mono text-sm text-cyber-muted-fg">
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-cyber-muted-fg transition hover:text-cyber-accent cyber-focus"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 cyber-icon" strokeWidth={1.5} />
                </button>
              </div>
              <div>{children}</div>
              {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
