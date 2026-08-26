import { motion, useReducedMotion } from 'framer-motion'
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

type AnswerAnalyzerProps = {
  answered: boolean
  scores: {
    technical: number
    communication: number
    confidence: number
    structure: number
  }
}

export function AnswerAnalyzer({ answered, scores }: AnswerAnalyzerProps) {
  const reduceMotion = useReducedMotion()
  const data = [
    { metric: 'Technical', value: scores.technical },
    { metric: 'Communication', value: scores.communication },
    { metric: 'Confidence', value: scores.confidence },
    { metric: 'Structure', value: scores.structure },
  ]

  return (
    <div className="cyber-card p-4">
      <p className="cyber-label">Performance analysis</p>
      {!answered ? (
        <p className="cyber-body-muted mt-6">
          Submit an answer to unlock live scoring across technical depth,
          communication, confidence, and structure.
        </p>
      ) : (
        <>
          <div className="mt-3 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="var(--color-cyber-border)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#6b7280', fontSize: 10 }}
                />
                <Radar
                  dataKey="value"
                  stroke="#00ff88"
                  fill="#00ff88"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-2">
            {data.map((item, i) => (
              <motion.li
                key={item.metric}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 * i }}
                className="border border-cyber-border bg-cyber-muted px-2.5 py-2 cyber-chamfer-sm"
              >
                <p className="cyber-label text-[10px]">{item.metric}</p>
                <p className="font-display text-lg font-bold text-cyber-accent">
                  {item.value}%
                </p>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
