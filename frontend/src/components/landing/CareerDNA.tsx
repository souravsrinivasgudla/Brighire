import { motion, useReducedMotion } from 'framer-motion'

const nodes = [
  { id: 'center', label: 'You', x: 50, y: 50, r: 28 },
  { id: 'skills', label: 'Skills', x: 22, y: 28, r: 20 },
  { id: 'exp', label: 'Experience', x: 78, y: 26, r: 20 },
  { id: 'projects', label: 'Projects', x: 80, y: 72, r: 18 },
  { id: 'goals', label: 'Goals', x: 20, y: 74, r: 18 },
  { id: 'cloud', label: 'Cloud', x: 50, y: 16, r: 14 },
  { id: 'lead', label: 'Leadership', x: 50, y: 84, r: 14 },
]

const edges: [string, string][] = [
  ['center', 'skills'],
  ['center', 'exp'],
  ['center', 'projects'],
  ['center', 'goals'],
  ['skills', 'cloud'],
  ['exp', 'cloud'],
  ['projects', 'lead'],
  ['goals', 'lead'],
]

export function CareerDNA() {
  const reduceMotion = useReducedMotion()
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <section
      id="career-dna"
      className="relative scroll-mt-28 overflow-hidden py-20 md:py-28"
    >
      <div className="relative z-10 cyber-container">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="cyber-label">Layer 03 · Career Analysis</p>
            <h2 className="cyber-h3 mt-3 text-3xl sm:text-4xl">Your Career DNA</h2>
            <p className="cyber-body-muted mt-4 max-w-md">
              A living fingerprint of skills, experience, projects, and goals —
              mapped like a neural network so the engine understands who you are
              becoming.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-cyber-fg">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-cyber-accent" />
                Strength clusters highlighted in real time
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-cyber-accent-secondary" />
                Gaps surfaced as opportunity edges
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-cyber-accent-tertiary" />
                Goals pulled into match scoring
              </li>
            </ul>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mx-auto aspect-square w-full max-w-md"
          >
            <div className="cyber-card absolute inset-0 flex items-center justify-center p-4">
              <svg
                viewBox="0 0 100 100"
                className="relative h-full w-full"
                role="img"
                aria-label="Career DNA neural map showing skills, experience, projects, and goals"
              >
                {edges.map(([a, b], i) => {
                  const from = byId[a]
                  const to = byId[b]
                  return (
                    <motion.line
                      key={`${a}-${b}`}
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#00ff88"
                      strokeOpacity={0.5}
                      strokeWidth="0.4"
                      initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 0.85 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.08 * i }}
                    />
                  )
                })}
                {nodes.map((node, i) => (
                  <g key={node.id}>
                    <motion.circle
                      cx={node.x}
                      cy={node.y}
                      r={node.r / 4}
                      fill={node.id === 'center' ? '#00ff88' : '#12121a'}
                      stroke={node.id === 'center' ? '#00ff88' : '#2a2a3a'}
                      strokeWidth="0.5"
                      initial={reduceMotion ? false : { scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * i, type: 'spring' }}
                      style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                    />
                    <text
                      x={node.x}
                      y={node.y + node.r / 3.2}
                      textAnchor="middle"
                      fill="#e0e0e0"
                      style={{ fontSize: '3.2px', fontWeight: 600 }}
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
