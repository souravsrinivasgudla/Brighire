import { motion, useReducedMotion } from 'framer-motion'
import { Lightbulb, ShieldAlert, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

type RecommendationPanelProps = {
  strengths: string[]
  missingKeywords: string[]
  suggestions: string[]
  optimizing: boolean
}

export function RecommendationPanel({
  strengths,
  missingKeywords,
  suggestions,
  optimizing,
}: RecommendationPanelProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex h-full min-h-[420px] flex-col overflow-hidden cyber-card">
      <div className="border-b border-cyber-border px-4 py-4">
        <p className="cyber-h3 text-sm">BrightHire Intelligence</p>
        <p className="cyber-body-muted">
          {optimizing ? 'Optimizing your resume…' : 'Recommendation engine ready'}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Section
          icon={<Sparkles className="h-4 w-4 text-cyber-accent cyber-icon" strokeWidth={1.5} />}
          title="Strengths"
          empty="Run analysis to surface strengths."
          items={strengths}
          tone="border-cyber-accent/30 bg-cyber-accent/10"
          reduceMotion={reduceMotion}
        />
        <Section
          icon={<ShieldAlert className="h-4 w-4 text-cyber-accent-secondary cyber-icon" strokeWidth={1.5} />}
          title="Missing Keywords"
          empty="No keyword gaps detected yet."
          items={missingKeywords}
          tone="border-cyber-accent-secondary/30 bg-cyber-accent-secondary/10"
          reduceMotion={reduceMotion}
        />
        <Section
          icon={<Lightbulb className="h-4 w-4 text-cyber-accent-tertiary cyber-icon" strokeWidth={1.5} />}
          title="Improvement Suggestions"
          empty="Suggestions appear after AI analysis."
          items={suggestions}
          tone="border-cyber-accent-tertiary/30 bg-cyber-accent-tertiary/10"
          reduceMotion={reduceMotion}
        />
      </div>
    </div>
  )
}

function Section({
  icon,
  title,
  items,
  empty,
  tone,
  reduceMotion,
}: {
  icon: ReactNode
  title: string
  items: string[]
  empty: string
  tone: string
  reduceMotion: boolean | null
}) {
  return (
    <div>
      <div className="cyber-label mb-2 flex items-center gap-2">
        {icon}
        {title}
      </div>
      {items.length === 0 ? (
        <p className="cyber-body-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 5).map((item, i) => (
            <motion.li
              key={item}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className={`border px-3 py-2.5 text-sm leading-relaxed text-cyber-fg cyber-chamfer-sm ${tone}`}
            >
              {item}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
