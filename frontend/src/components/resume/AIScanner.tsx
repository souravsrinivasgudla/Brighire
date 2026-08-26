import { motion, useReducedMotion } from 'framer-motion'

import { Button } from '../ui/Button'

type AIScannerProps = {
  analyzing: boolean
  complete: boolean
  ats: number
  skill: number
  impact: number
  onAnalyze: () => void
}

const METRIC_COLORS = ['#00ff88', '#00d4ff', '#ff00ff'] as const

function RingMetric({
  label,
  value,
  color,
}: {
  label: string
  value: number
  color: string
}) {
  const reduceMotion = useReducedMotion()
  const r = 28
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c

  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <div className="relative h-20 w-20 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="var(--color-cyber-border)"
            strokeWidth="6"
          />
          <motion.circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={reduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-cyber-accent">
          {value}
        </span>
      </div>
      <p className="cyber-label text-center text-[9px] leading-tight">{label}</p>
    </div>
  )
}

export function AIScanner({
  analyzing,
  complete,
  ats,
  skill,
  impact,
  onAnalyze,
}: AIScannerProps) {
  return (
    <div className="flex flex-col items-center cyber-card p-6 text-center">
      <div
        className={`flex h-36 w-36 flex-col items-center justify-center gap-2 border bg-cyber-muted p-4 text-center cyber-chamfer-sm ${
          analyzing
            ? 'border-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
            : complete
              ? 'border-cyber-accent/40'
              : 'border-cyber-border'
        }`}
      >
        <span className="font-label text-[9px] uppercase leading-none tracking-[0.2em] text-cyber-accent">
          AI Core
        </span>
        <span className="font-display text-[11px] font-bold uppercase leading-tight tracking-wide text-cyber-fg">
          {analyzing
            ? 'Analyzing Resume'
            : complete
              ? 'Analysis Complete'
              : 'Ready to Scan'}
        </span>
        <span
          className={`h-1.5 w-1.5 shrink-0 ${
            analyzing
              ? 'animate-pulse bg-cyber-accent-tertiary'
              : complete
                ? 'bg-cyber-accent'
                : 'bg-cyber-muted-fg'
          }`}
          aria-hidden="true"
        />
      </div>

      {complete ? (
        <div className="mt-6 grid w-full grid-cols-3 gap-4">
          <RingMetric label="ATS Score" value={ats} color={METRIC_COLORS[0]} />
          <RingMetric label="Skill Strength" value={skill} color={METRIC_COLORS[1]} />
          <RingMetric label="Experience Impact" value={impact} color={METRIC_COLORS[2]} />
        </div>
      ) : (
        <p className="mt-6 max-w-sm cyber-body-muted">
          Run the engine to extract skills, score ATS readiness, and surface
          improvements.
        </p>
      )}

      <Button
        type="button"
        variant="glitch"
        className="mt-6"
        disabled={analyzing}
        onClick={onAnalyze}
      >
        {analyzing ? 'Scanning…' : complete ? 'Re-run Analysis' : 'Start AI Analysis'}
      </Button>
    </div>
  )
}
