import { motion, useReducedMotion } from 'framer-motion'

import { SectionHeading } from '../ui/SectionHeading'

type SkillGapMapProps = {
  current: string[]
  missing: string[]
}

const MAX_SKILLS = 5

type SkillColumnProps = {
  label: string
  skills: string[]
  tone: 'current' | 'missing'
  reduceMotion: boolean
}

const toneStyles = {
  current: {
    label: 'text-cyber-accent',
    chip: 'border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent',
  },
  missing: {
    label: 'text-cyber-accent-secondary',
    chip: 'border-cyber-accent-secondary/30 bg-cyber-accent-secondary/10 text-cyber-accent-secondary',
  },
} as const

function SkillColumn({ label, skills, tone, reduceMotion }: SkillColumnProps) {
  const styles = toneStyles[tone]

  return (
    <div className="min-w-0">
      <p className={`cyber-label mb-2 text-[10px] ${styles.label}`}>{label}</p>
      <ul className="space-y-2">
        {skills.map((skill, index) => (
          <motion.li
            key={skill}
            initial={reduceMotion ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.05 * index }}
            viewport={{ once: true }}
            className={`flex min-h-10 items-center border px-3 py-2 text-sm font-semibold leading-snug break-words cyber-chamfer-sm ${styles.chip}`}
          >
            {skill}
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

export function SkillGapMap({ current, missing }: SkillGapMapProps) {
  const reduceMotion = useReducedMotion()
  const left = current.length ? current.slice(0, MAX_SKILLS) : ['Analyze to detect']
  const right = missing.length ? missing.slice(0, MAX_SKILLS) : ['No gaps yet']

  return (
    <div className="cyber-card @container p-5">
      <SectionHeading eyebrow="Skill Gap Analysis" title="Network skill map" />

      <div className="mt-5 grid items-start gap-x-4 gap-y-5 @md:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] @md:gap-y-0">
        <SkillColumn
          label="Current Skills"
          skills={left}
          tone="current"
          reduceMotion={!!reduceMotion}
        />

        <div
          className="hidden self-stretch @md:flex @md:flex-col"
          aria-hidden="true"
        >
          {/* Empty copy of the column label so the spine starts at the first row. */}
          <p className="cyber-label invisible mb-2 text-[10px]">.</p>
          <span className="mx-auto w-px flex-1 border-l border-dashed border-cyber-accent/40" />
        </div>

        <SkillColumn
          label="Missing Skills"
          skills={right}
          tone="missing"
          reduceMotion={!!reduceMotion}
        />
      </div>
    </div>
  )
}
