import { useState } from 'react'

import { AIInterviewRoom } from './AIInterviewRoom'
import { AnswerAnalyzer } from './AnswerAnalyzer'
import { PerformanceReport } from './PerformanceReport'
import { QuestionGenerator, type InterviewQuestion } from './QuestionGenerator'

const MODES = [
  {
    id: 'quick',
    title: 'Quick Practice',
    time: '15 minutes',
    description: 'Rapid-fire warm-up with focused feedback.',
  },
  {
    id: 'full',
    title: 'Full Interview',
    time: '45 minutes',
    description: 'End-to-end loop with scoring and report.',
  },
  {
    id: 'technical',
    title: 'Technical Round',
    time: '30 minutes',
    description: 'Deep technical depth and architecture.',
  },
  {
    id: 'system',
    title: 'System Design Round',
    time: '40 minutes',
    description: 'Scalability, tradeoffs, and storytelling.',
  },
  {
    id: 'hr',
    title: 'HR Round',
    time: '20 minutes',
    description: 'Behavioral clarity and confidence.',
  },
] as const

export function InterviewCoach() {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('quick')
  const [question, setQuestion] = useState<InterviewQuestion | null>(null)
  const [answered, setAnswered] = useState(false)
  const [scores, setScores] = useState({
    technical: 0,
    communication: 0,
    confidence: 0,
    structure: 0,
  })

  function handleAnswered() {
    setAnswered(true)
    setScores({
      technical: 88,
      communication: 82,
      confidence: 76,
      structure: 90,
    })
  }

  return (
    <section className="space-y-5 cyber-card p-5 sm:p-6">
      <div>
        <p className="cyber-label">Interview Preparation Center</p>
        <h2 className="cyber-h3 mt-1 text-2xl">AI Interview Coach</h2>
        <p className="cyber-body-muted mt-2">
          A personal AI interviewer that prepares you for every round.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {MODES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setMode(item.id)
              setAnswered(false)
            }}
            className={`border p-3 text-left transition cyber-chamfer-sm cyber-focus ${
              mode === item.id
                ? 'border-cyber-accent bg-cyber-accent/10 shadow-[var(--box-shadow-neon-sm)]'
                : 'border-cyber-border bg-cyber-muted hover:border-cyber-accent/50'
            }`}
          >
            <p className="text-sm font-bold text-cyber-fg">{item.title}</p>
            <p className="cyber-label mt-1 text-[10px] text-cyber-accent">
              {item.time}
            </p>
            <p className="cyber-body-muted mt-2 text-xs">{item.description}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
        <QuestionGenerator
          mode={mode}
          selected={question}
          onSelect={(q) => {
            setQuestion(q)
            setAnswered(false)
          }}
        />
        <AIInterviewRoom
          question={question}
          onSubmitAnswer={handleAnswered}
        />
        <AnswerAnalyzer answered={answered} scores={scores} />
      </div>

      {answered ? <PerformanceReport scores={scores} /> : null}
    </section>
  )
}
