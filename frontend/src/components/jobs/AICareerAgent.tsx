import { Bot, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '../ui/Button'

const SUGGESTIONS = [
  'Which one should I prioritize?',
  'Show remote DevOps roles',
  'What skills unlock more matches?',
]

type AICareerAgentProps = {
  highMatchCount: number
}

export function AICareerAgent({ highMatchCount }: AICareerAgentProps) {
  const [open, setOpen] = useState(false)
  const [asked, setAsked] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [reply, setReply] = useState('')

  const intro = `I found ${highMatchCount} roles where your profile matches above 85%.`

  useEffect(() => {
    if (!asked) return
    setThinking(true)
    setReply('')
    const text =
      'Focus on AWS DevOps roles because they align with your strongest skills.'
    const t = window.setTimeout(() => {
      setThinking(false)
      let i = 0
      const id = window.setInterval(() => {
        i += 1
        setReply(text.slice(0, i))
        if (i >= text.length) window.clearInterval(id)
      }, 18)
    }, 600)
    return () => window.clearTimeout(t)
  }, [asked])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-40 inline-flex h-14 w-14 items-center justify-center border-2 border-cyber-accent bg-cyber-accent text-cyber-bg shadow-[var(--box-shadow-neon-lg)] transition hover:brightness-110 cyber-chamfer-sm cyber-focus lg:bottom-6"
        aria-label={open ? 'Close career agent' : 'Open career agent'}
        aria-expanded={open}
      >
        {open ? (
          <Bot className="h-6 w-6" strokeWidth={1.5} />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={1.5} />
        )}
      </button>

      {open ? (
        <div
          className="fixed bottom-40 right-4 z-40 w-[min(100%-2rem,22rem)] overflow-hidden cyber-card lg:bottom-24"
          role="dialog"
          aria-label="AI career agent"
        >
          <div className="border-b border-cyber-border px-4 py-3">
            <p className="cyber-h3 text-sm">AI Career Agent</p>
            <p className="font-mono text-xs text-cyber-muted-fg">Your personal recruiter · 24/7</p>
          </div>
          <div className="max-h-72 space-y-3 overflow-y-auto p-4 text-xs">
            <div className="max-w-[90%] border border-cyber-accent/30 bg-cyber-accent/10 px-3 py-2 font-mono leading-relaxed text-cyber-fg cyber-chamfer-sm">
              {intro}
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAsked(true)}
                  className="border border-cyber-border bg-cyber-muted px-3 py-1.5 text-left font-mono font-medium text-cyber-muted-fg transition hover:border-cyber-accent hover:text-cyber-accent cyber-chamfer-sm cyber-focus"
                >
                  {q}
                </button>
              ))}
            </div>
            {asked ? (
              <>
                <div className="ml-auto max-w-[85%] border border-cyber-border bg-cyber-muted px-3 py-2 font-mono text-cyber-fg cyber-chamfer-sm">
                  Which one should I prioritize?
                </div>
                <div className="max-w-[90%] border border-cyber-border bg-cyber-muted px-3 py-2 font-mono leading-relaxed text-cyber-fg cyber-chamfer-sm">
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
          <div className="border-t border-cyber-border p-3">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
              Close Terminal
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
