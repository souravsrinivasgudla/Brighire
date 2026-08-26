import { motion, useReducedMotion } from 'framer-motion'

const jobs = [
  {
    company: 'Amazon',
    role: 'Cloud Engineer',
    match: 96,
    why: ['AWS experience', 'Kubernetes skills', 'Python background'],
  },
  {
    company: 'Stripe',
    role: 'Platform Engineer',
    match: 91,
    why: ['Distributed systems', 'CI/CD ownership', 'API design'],
  },
  {
    company: 'Datadog',
    role: 'DevOps Engineer',
    match: 88,
    why: ['Observability mindset', 'Docker fluency', 'On-call readiness'],
  },
]

export function JobMatchingEngine() {
  const reduceMotion = useReducedMotion()

  return (
    <section
      id="job-matching"
      className="relative scroll-mt-28 overflow-hidden py-20 md:py-28"
    >
      <div className="relative z-10 cyber-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="cyber-label">Layer 04 · Job Matching Engine</p>
          <h2 className="cyber-h3 mt-3 text-3xl sm:text-4xl">
            Opportunities that orbit you
          </h2>
          <p className="cyber-body-muted mt-3">
            Ranked by fit — not keyword spam.
          </p>
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {jobs.map((job, i) => (
            <motion.li
              key={job.company}
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="cyber-card cyber-card-hover p-6 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="cyber-label">{job.company}</p>
                  <h3 className="cyber-h3 mt-1 text-lg">{job.role}</h3>
                </div>
                <span className="border border-cyber-accent bg-cyber-accent/10 px-3 py-1 font-mono text-sm font-bold text-cyber-accent cyber-chamfer-sm">
                  {job.match}%
                </span>
              </div>
              <p className="cyber-label mt-4">Why</p>
              <ul className="mt-2 space-y-1.5">
                {job.why.map((reason) => (
                  <li
                    key={reason}
                    className="flex items-center gap-2 text-sm text-cyber-fg"
                  >
                    <span className="h-1 w-1 bg-cyber-accent" />
                    {reason}
                  </li>
                ))}
              </ul>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
