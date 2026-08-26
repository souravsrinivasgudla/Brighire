import { SectionHeading } from '../ui/SectionHeading'

const nodes = [
  { id: 'center', label: 'You', x: 50, y: 50 },
  { id: 'skills', label: 'Skills', x: 22, y: 30 },
  { id: 'projects', label: 'Projects', x: 78, y: 28 },
  { id: 'exp', label: 'Experience', x: 82, y: 70 },
  { id: 'certs', label: 'Certs', x: 50, y: 86 },
  { id: 'goals', label: 'Goals', x: 18, y: 72 },
]

const edges: [string, string][] = [
  ['center', 'skills'],
  ['center', 'projects'],
  ['center', 'exp'],
  ['center', 'certs'],
  ['center', 'goals'],
  ['skills', 'goals'],
  ['projects', 'exp'],
]

type CareerDNAProps = {
  initials: string
}

export function CareerDNA({ initials }: CareerDNAProps) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]))

  return (
    <section id="career-dna" className="scroll-mt-6 cyber-card p-5 sm:p-6">
      <SectionHeading
        eyebrow="// career dna"
        tone="secondary"
        title="Your Career Fingerprint"
      />

      <div className="relative mx-auto mt-6 aspect-square w-full max-w-sm">
        <svg
          viewBox="0 0 100 100"
          className="relative h-full w-full"
          role="img"
          aria-label="Career DNA map"
        >
          {edges.map(([a, b]) => {
            const from = byId[a]
            const to = byId[b]
            return (
              <line
                key={`${a}-${b}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#00ff88"
                strokeOpacity="0.4"
                strokeWidth="0.45"
              />
            )
          })}
          {nodes.map((node) =>
            node.id === 'center' ? (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="9"
                  fill="#00ff88"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' }}
                />
                <text
                  x={node.x}
                  y={node.y + 1.5}
                  textAnchor="middle"
                  fill="#0a0a0f"
                  style={{ fontSize: '4px', fontWeight: 700 }}
                >
                  {initials.slice(0, 2) || 'U'}
                </text>
              </g>
            ) : (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="5.5"
                  fill="#12121a"
                  stroke="#00ff88"
                  strokeWidth="0.5"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,136,0.4))' }}
                />
                <text
                  x={node.x}
                  y={node.y + 9}
                  textAnchor="middle"
                  fill="#6b7280"
                  style={{ fontSize: '3px', fontWeight: 600 }}
                >
                  {node.label}
                </text>
              </g>
            ),
          )}
        </svg>
      </div>
    </section>
  )
}
