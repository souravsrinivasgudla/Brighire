import { motion, useReducedMotion } from 'framer-motion'

type ATSScoreProps = {
  score: number
}

const segments = [
  { label: 'Keywords', color: '#00ff88' },
  { label: 'Formatting', color: '#00d4ff' },
  { label: 'Experience', color: '#ff00ff' },
  { label: 'Skills', color: '#00ff88' },
]

export function ATSScore({ score }: ATSScoreProps) {
  const reduceMotion = useReducedMotion()
  const r = 52
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c

  return (
    <div className="cyber-card p-5">
      <p className="cyber-label">ATS Compatibility</p>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
        <div className="relative h-36 w-36">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke="var(--color-cyber-border)"
              strokeWidth="12"
            />
            <motion.circle
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke="#00ff88"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={c}
              initial={reduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: c }}
              whileInView={{ strokeDashoffset: offset }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              style={{ filter: 'drop-shadow(0 0 8px #00ff88)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-extrabold text-cyber-accent">
              {score}%
            </span>
            <span className="cyber-label text-[10px]">ATS</span>
          </div>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {segments.map((seg) => (
            <li
              key={seg.label}
              className="border border-cyber-border bg-cyber-muted px-3 py-2 text-xs font-semibold text-cyber-fg cyber-chamfer-sm"
            >
              <span
                className="mr-2 inline-block h-2 w-2"
                style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}` }}
              />
              {seg.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
