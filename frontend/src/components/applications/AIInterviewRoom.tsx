import { Bot, User } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../ui/Button'
import type { InterviewQuestion } from './QuestionGenerator'

type AIInterviewRoomProps = {
  question: InterviewQuestion | null
  onSubmitAnswer: () => void
}

export function AIInterviewRoom({
  question,
  onSubmitAnswer,
}: AIInterviewRoomProps) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="flex min-h-[420px] flex-col overflow-hidden cyber-card">
      <div className="flex items-center justify-between border-b border-cyber-border px-4 py-3">
        <div>
          <p className="cyber-h3 text-sm">BrightHire Interview AI</p>
          <p className="font-mono text-xs text-cyber-accent">Ready</p>
        </div>
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping bg-cyber-accent opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 bg-cyber-accent" />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-cyber-border p-4">
        <div className="flex aspect-video flex-col items-center justify-center border border-cyber-border bg-cyber-muted cyber-chamfer-sm">
          <Bot className="h-8 w-8 text-cyber-accent-secondary cyber-icon" strokeWidth={1.5} />
          <p className="cyber-label mt-2">AI Avatar</p>
        </div>
        <div className="flex aspect-video flex-col items-center justify-center border border-cyber-border bg-cyber-muted cyber-chamfer-sm">
          <User className="h-8 w-8 text-cyber-accent-tertiary cyber-icon" strokeWidth={1.5} />
          <p className="cyber-label mt-2">You</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
        <div className="max-w-[90%] border border-cyber-border bg-cyber-muted px-3 py-2.5 text-cyber-fg cyber-chamfer-sm">
          {question?.prompt ??
            'Select a question to begin your mock interview session.'}
        </div>
        {submitted ? (
          <div className="ml-auto max-w-[90%] border border-cyber-accent/30 bg-cyber-accent/10 px-3 py-2.5 text-cyber-fg cyber-chamfer-sm">
            {answer}
          </div>
        ) : null}
      </div>

      <div className="border-t border-cyber-border p-3">
        <label className="sr-only" htmlFor="interview-answer">
          Your answer
        </label>
        <textarea
          id="interview-answer"
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!question}
          placeholder="Respond as you would in a live interview…"
          className="w-full border border-cyber-border bg-cyber-muted px-3 py-2 text-sm text-cyber-fg placeholder:text-cyber-muted-fg outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent/30 disabled:opacity-50 cyber-chamfer-sm"
        />
        <Button
          type="button"
          variant="glitch"
          className="mt-2 w-full"
          disabled={!question || answer.trim().length < 12}
          onClick={() => {
            setSubmitted(true)
            onSubmitAnswer()
          }}
        >
          Submit answer for AI evaluation
        </Button>
      </div>
    </div>
  )
}
