import { motion, useReducedMotion } from 'framer-motion'
import { Bot, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/Button'

const SUGGESTIONS = [
  'How can I improve this resume?',
  'What keywords am I missing?',
  'Rewrite my experience bullets',
]

const AI_REPLY =
  'Your backend projects are strong. Add deployment architecture details and measurable outcomes to lift ATS and impact scores.'

export function AIResumeChat() {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [reply, setReply] = useState('')
  const [asked, setAsked] = useState(false)

  useEffect(() => {
    if (!asked || reduceMotion) {
      if (asked && reduceMotion) setReply(AI_REPLY)
      return
    }
    setThinking(true)
    setReply('')
    const t = window.setTimeout(() => {
      setThinking(false)
      let i = 0
      const id = window.setInterval(() => {
        i += 1
        setReply(AI_REPLY.slice(0, i))
        if (i >= AI_REPLY.length) window.clearInterval(id)
      }, 18)
    }, 700)
    return () => window.clearTimeout(t)
  }, [asked, reduceMotion])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-40 inline-flex h-14 w-14 items-center justify-center border border-cyber-accent bg-cyber-accent text-cyber-bg shadow-[var(--box-shadow-neon-sm)] transition hover:brightness-110 cyber-chamfer-sm cyber-focus lg:bottom-6"
        aria-label={open ? 'Close resume AI chat' : 'Open resume AI chat'}
        aria-expanded={open}
      >
        {open ? (
          <Bot className="h-6 w-6 cyber-icon" strokeWidth={1.5} />
        ) : (
          <MessageCircle className="h-6 w-6 cyber-icon" strokeWidth={1.5} />
        )}
      </button>

      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-40 right-4 z-40 flex w-[min(100%-2rem,22rem)] flex-col overflow-hidden cyber-card lg:bottom-24"
          role="dialog"
          aria-label="Resume AI assistant"
        >
          <div className="border-b border-cyber-border px-4 py-3">
            <p className="cyber-h3 text-sm">Resume AI Coach</p>
            <p className="cyber-body-muted mt-0.5">Ask how to improve this file</p>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((q) => (
                <Button
                  key={q}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAsked(true)}
                  className="text-[11px]"
                >
                  {q}
                </Button>
              ))}
            </div>
            {asked ? (
              <>
                <div className="ml-auto max-w-[85%] border border-cyber-accent/30 bg-cyber-accent/10 px-3 py-2 text-xs text-cyber-fg cyber-chamfer-sm">
                  How can I improve this resume?
                </div>
                <div className="max-w-[90%] border border-cyber-border bg-cyber-muted px-3 py-2 text-xs leading-relaxed text-cyber-fg cyber-chamfer-sm">
                  {thinking ? (
                    <span className="inline-flex gap-1" aria-label="Thinking">
                      <span className="h-1.5 w-1.5 animate-bounce bg-cyber-accent" />
                      <span className="h-1.5 w-1.5 animate-bounce bg-cyber-accent [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce bg-cyber-accent [animation-delay:240ms]" />
                    </span>
                  ) : (
                    reply
                  )}
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </>
  )
}
