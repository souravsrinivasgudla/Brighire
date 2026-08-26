import { motion, useReducedMotion } from 'framer-motion'
import { FileText, Radar, Sparkles } from 'lucide-react'

const skills = ['Python', 'AWS', 'Docker', 'Kubernetes']

export function ResumeScanner() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      id="resume-scanner"
      className="relative scroll-mt-28 overflow-hidden py-20 md:py-28"
    >
      <div className="relative z-10 cyber-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="cyber-label">Layer 02 · Resume Intelligence</p>
          <h2 className="cyber-h3 mt-3 text-3xl sm:text-4xl">
            Watch the AI scan your story
          </h2>
          <p className="cyber-body-muted mt-3">
            Documents enter the engine. Signal emerges. Opportunities unlock.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="cyber-card relative overflow-hidden p-6">
              <div className="mb-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-cyber-accent cyber-icon" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-sm font-semibold text-cyber-fg">resume_v4.pdf</p>
              </div>
              <div className="space-y-3 font-mono text-xs leading-relaxed text-cyber-muted-fg">
                <p className="text-cyber-fg">Alex Rivera · Cloud Engineer</p>
                <p>Built multi-region AWS infrastructure serving 2M requests/day…</p>
                <p>Orchestrated Kubernetes clusters across 14 microservices…</p>
                <p>Automated CI/CD with Python tooling and Docker images…</p>
              </div>
              {!reduceMotion ? (
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 h-16 bg-cyber-accent/10"
                  animate={{ top: ['0%', '85%', '0%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                />
              ) : null}
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="cyber-card p-6 sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center border border-cyber-accent bg-cyber-muted text-cyber-accent cyber-chamfer-sm">
                <Radar className="h-5 w-5 cyber-icon" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-cyber-fg">AI Analysis Engine</p>
                <p className="cyber-body-muted text-xs">Live inference stream</p>
              </div>
            </div>

            <p className="cyber-label">Detected Skills</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <motion.li
                  key={skill}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 * i }}
                  className="border border-cyber-accent/40 bg-cyber-accent/10 px-3 py-1.5 text-sm font-semibold text-cyber-accent cyber-chamfer-sm"
                >
                  {skill}
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 border border-cyber-border bg-cyber-bg p-4 cyber-chamfer-sm">
              <div className="flex items-start gap-2">
                <Sparkles
                  className="mt-0.5 h-4 w-4 shrink-0 text-cyber-accent cyber-icon"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <p className="text-sm leading-relaxed text-cyber-fg">
                  <span className="font-semibold text-cyber-accent">AI Insight:</span>{' '}
                  Your cloud skills match 87% of DevOps roles.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
