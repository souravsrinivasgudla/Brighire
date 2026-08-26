import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

import { AIStatus } from '../ui/AIStatus'

type AICoachPanelProps = {
  onClose?: () => void
}

const AI_REPLY =
  'Your Kubernetes skills are improving. Three DevOps roles match your profile.'

export function AICoachPanel({ onClose }: AICoachPanelProps) {
  const reduceMotion = useReducedMotion()
  const [typed, setTyped] = useState(reduceMotion ? AI_REPLY : '')
  const [thinking, setThinking] = useState(!reduceMotion)

  useEffect(() => {
    if (reduceMotion) {
      setTyped(AI_REPLY)
      setThinking(false)
      return
    }
    setThinking(true)
    setTyped('')
    const thinkTimer = window.setTimeout(() => {
      setThinking(false)
      let i = 0
      const id = window.setInterval(() => {
        i += 1
        setTyped(AI_REPLY.slice(0, i))
        if (i >= AI_REPLY.length) window.clearInterval(id)
      }, 22)
    }, 900)
    return () => window.clearTimeout(thinkTimer)
  }, [reduceMotion])

  return (
    <div id="ai-coach" className="flex h-full flex-col overflow-hidden cyber-card">
      <div className="flex items-center justify-between border-b border-cyber-border px-4 py-4">
        <div>
          <p className="cyber-h3 text-sm">BrightHire AI</p>
          <p className="mt-1 font-mono text-xs text-cyber-muted-fg">
            {thinking ? 'Analyzing career profile…' : 'Ready to guide you'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIStatus state={thinking ? 'analyzing' : 'online'} className="hidden sm:inline-flex" />
          {onClose ? (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center border border-cyber-border bg-cyber-muted text-cyber-muted-fg transition hover:border-cyber-accent hover:text-cyber-accent cyber-chamfer-sm cyber-focus"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <div className="max-w-[90%] border border-cyber-accent/30 bg-cyber-accent/10 px-3.5 py-2.5 font-mono text-sm leading-relaxed text-cyber-fg cyber-chamfer-sm">
          {thinking ? (
            <span className="inline-flex gap-1" aria-label="AI thinking">
              <span className="h-1.5 w-1.5 animate-bounce bg-cyber-accent [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce bg-cyber-accent [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 animate-bounce bg-cyber-accent [animation-delay:240ms]" />
            </span>
          ) : (
            typed
          )}
        </div>

        <div className="ml-auto max-w-[85%] border border-cyber-border bg-cyber-muted px-3.5 py-2.5 font-mono text-sm text-cyber-fg cyber-chamfer-sm">
          What should I learn next?
        </div>

        {!thinking ? (
          <div className="max-w-[90%] border border-cyber-border bg-cyber-muted px-3.5 py-2.5 font-mono text-sm leading-relaxed text-cyber-muted-fg cyber-chamfer-sm">
            Prioritize Terraform next — it unlocks ~24% more DevOps matches in
            your Career DNA.
          </div>
        ) : null}
      </div>

      <div className="border-t border-cyber-border p-3">
        <label className="sr-only" htmlFor="coach-input">
          Message AI coach
        </label>
        <input
          id="coach-input"
          type="text"
          placeholder="Ask your career AI…"
          className="w-full border border-cyber-border bg-cyber-bg px-3 py-2.5 font-mono text-sm text-cyber-fg placeholder:text-cyber-muted-fg outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent cyber-chamfer-sm"
        />
      </div>
    </div>
  )
}
