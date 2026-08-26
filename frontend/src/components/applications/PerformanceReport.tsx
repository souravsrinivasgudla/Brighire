import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type PerformanceReportProps = {
  scores: {
    technical: number
    communication: number
    confidence: number
    structure: number
  }
}

const IMPROVEMENT = [
  { label: 'Before', confidence: 72 },
  { label: 'After practice', confidence: 89 },
]

export function PerformanceReport({ scores }: PerformanceReportProps) {
  return (
    <section className="cyber-card p-5">
      <p className="cyber-label">AI Feedback Report</p>
      <h3 className="cyber-h3 mt-1">Career improvement loop</h3>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-3 text-sm">
          <Block
            title="Strengths"
            items={[
              'Technically strong explanations with clear domain vocabulary.',
              `Structure score at ${scores.structure}% — strong narrative bones.`,
            ]}
          />
          <Block
            title="Weaknesses"
            items={[
              'Confidence dips when quantifying outcomes.',
              'Your explanation is technically strong but lacks structured storytelling.',
            ]}
          />
          <Block
            title="Next Practice Topics"
            items={[
              'STAR storytelling for behavioral rounds',
              'Capacity planning for system design',
              'Incident leadership narratives',
            ]}
          />
        </div>

        <div className="border border-cyber-border bg-cyber-muted p-4 cyber-chamfer-sm">
          <p className="cyber-label">Confidence trajectory</p>
          <div className="mt-2 flex gap-6 text-sm">
            <div>
              <p className="text-cyber-muted-fg">Before Interview</p>
              <p className="font-display text-3xl font-bold text-cyber-accent-secondary">
                72
              </p>
            </div>
            <div>
              <p className="text-cyber-muted-fg">After Practice</p>
              <p className="font-display text-3xl font-bold text-cyber-accent">
                89
              </p>
            </div>
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={IMPROVEMENT}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    background: '#12121a',
                    border: '1px solid #2a2a3a',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#00ff88"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#00ff88' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="cyber-label text-[10px]">{title}</p>
      <ul className="mt-1.5 space-y-1 text-cyber-fg">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}
