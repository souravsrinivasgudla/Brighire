import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STAGES = [
  { id: 'applied', label: 'Applied', statuses: ['applied'] },
  { id: 'reviewing', label: 'Recruiter Review', statuses: ['reviewing'] },
  { id: 'interview', label: 'Interview', statuses: ['interview'] },
  { id: 'offer', label: 'Offer', statuses: ['offer'] },
  { id: 'rejected', label: 'Closed', statuses: ['rejected', 'withdrawn'] },
] as const

type CareerPipelineProps = {
  counts: Record<string, number>
  total: number
}

function AnimatedCount({ value }: { value: number }) {
  const reduceMotion = useReducedMotion()
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 90, damping: 22 })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value)
      return
    }
    motionValue.set(value)
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)))
    return () => unsub()
  }, [value, motionValue, spring, reduceMotion])

  return <span>{display}</span>
}

export function CareerPipeline({ counts, total }: CareerPipelineProps) {
  const interviews = counts.interview ?? 0
  const offers = counts.offer ?? 0
  const reduceMotion = useReducedMotion()

  return (
    <section className="cyber-card p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="cyber-label">Career Pipeline Overview</p>
          <h1 className="cyber-h3 mt-1 text-2xl sm:text-3xl">
            Application Intelligence
          </h1>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Stat label="Active Applications" value={total} />
          <Stat label="Interviews" value={interviews} />
          <Stat label="Offers Pending" value={offers} />
        </div>
      </div>

      <ol className="relative mt-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div
          className="absolute left-[8%] top-5 hidden h-px w-[84%] bg-cyber-border sm:block"
          aria-hidden="true"
        />
        {STAGES.map((stage, i) => {
          const count = stage.statuses.reduce(
            (sum, s) => sum + (counts[s] ?? 0),
            0,
          )
          const pct =
            total > 0 ? Math.round((count / Math.max(total, 1)) * 100) : 0
          const active = count > 0

          return (
            <motion.li
              key={stage.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * i }}
              className="relative z-10 flex flex-1 flex-col items-center text-center"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center border text-xs font-bold cyber-chamfer-sm ${
                  active
                    ? 'border-cyber-accent bg-cyber-accent/15 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
                    : 'border-cyber-border bg-cyber-muted text-cyber-muted-fg'
                }`}
              >
                {count}
              </span>
              <p className="mt-3 text-xs font-semibold text-cyber-fg">
                {stage.label}
              </p>
              <p className="mt-1 font-mono text-[10px] text-cyber-muted-fg">
                {pct}% of pipeline
              </p>
            </motion.li>
          )
        })}
      </ol>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-cyber-border bg-cyber-muted px-3 py-2 cyber-chamfer-sm">
      <p className="cyber-label text-[10px]">{label}</p>
      <p className="font-display text-xl font-bold text-cyber-accent">
        <AnimatedCount value={value} />
      </p>
    </div>
  )
}
