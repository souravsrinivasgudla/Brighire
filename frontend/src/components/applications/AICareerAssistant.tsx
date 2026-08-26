import { motion, useReducedMotion } from 'framer-motion'
import { Bot, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/Button'

const SUGGESTIONS = [
  'Start a 30-minute prep session',
  'Review system design gaps',
  'Practice behavioral STAR stories',
]

export function AICareerAssistant() {
  const reduceMotion = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [asked, setAsked] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [reply, setReply] = useState('')

  useEffect(() => {
    if (!asked) return
    const text =
      'Great — let\'s run a focused 30-minute session: 2 technical prompts and 1 behavioral story with live scoring.'
    if (reduceMotion) {
      setReply(text)
      return
    }
    setThinking(true)
    setReply('')
    const t = window.setTimeout(() => {
      setThinking(false)
      let i = 0
      const id = window.setInterval(() => {
        i += 1
        setReply(text.slice(0, i))
        if (i >= text.length) window.clearInterval(id)
      }, 16)
    }, 500)
    return () => window.clearTimeout(t)
  }, [asked, reduceMotion])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-40 inline-flex h-14 w-14 items-center justify-center border border-cyber-accent bg-cyber-accent text-cyber-bg shadow-[var(--box-shadow-neon-sm)] transition hover:brightness-110 cyber-chamfer-sm cyber-focus lg:bottom-6"
        aria-label={open ? 'Close career assistant' : 'Open career assistant'}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-40 right-4 z-40 w-[min(100%-2rem,22rem)] overflow-hidden cyber-card lg:bottom-24"
          role="dialog"
          aria-label="BrightHire career assistant"
        >
          <div className="border-b border-cyber-border px-4 py-3">
            <p className="cyber-h3 text-sm">BrightHire AI</p>
            <p className="cyber-body-muted mt-0.5">Interview readiness companion</p>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4 text-xs">
            <div className="max-w-[92%] border border-cyber-border bg-cyber-muted px-3 py-2 leading-relaxed text-cyber-fg cyber-chamfer-sm">
              Your interview starts tomorrow. Would you like a 30-minute
              preparation session?
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAsked(true)}
                  className="text-[11px]"
                >
                  {s}
                </Button>
              ))}
            </div>
            {asked ? (
              <div className="max-w-[92%] border border-cyber-border bg-cyber-muted px-3 py-2 leading-relaxed text-cyber-fg cyber-chamfer-sm">
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
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </>
  )
}
