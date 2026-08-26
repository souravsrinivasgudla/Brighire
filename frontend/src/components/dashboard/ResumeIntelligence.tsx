import { Sparkles } from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { chartTheme } from '../ui/chartTheme'
import { SectionHeading, SectionLink } from '../ui/SectionHeading'

type ResumeIntelligenceProps = {
  ats: number
  keyword: number
  impact: number
  recommendations: string[]
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-xs">
        <span className="truncate text-cyber-muted-fg">{label}</span>
        <span className="shrink-0 font-bold text-cyber-accent">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden border border-cyber-border bg-cyber-bg">
        <div
          className="h-full bg-cyber-accent transition-all duration-700"
          style={{ width: `${value}%`, boxShadow: '0 0 12px rgba(0,255,136,0.5)' }}
        />
      </div>
    </div>
  )
}

export function ResumeIntelligence({
  ats,
  keyword,
  impact,
  recommendations,
}: ResumeIntelligenceProps) {
  const chartData = [
    { name: 'ATS', score: ats },
    { name: 'Keywords', score: keyword },
    { name: 'Impact', score: impact },
  ]

  return (
    <section className="cyber-card p-5 sm:p-6">
      <SectionHeading
        eyebrow="// resume intelligence"
        title="Signal From Your Resume"
        action={<SectionLink to="/resumes">Open resumes</SectionLink>}
      />

      <div className="mt-6 grid items-center gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Meter label="ATS Score" value={ats} />
          <Meter label="Keyword Match" value={keyword} />
          <Meter label="Impact Score" value={impact} />
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                tick={{ fill: chartTheme.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip
                cursor={{ fill: 'rgba(0,255,136,0.04)' }}
                contentStyle={{
                  background: chartTheme.tooltip.bg,
                  border: `1px solid ${chartTheme.tooltip.border}`,
                  color: chartTheme.tooltip.text,
                }}
              />
              <Bar dataKey="score" fill={chartTheme.colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <p className="cyber-label">AI Recommendations</p>
        {recommendations.length === 0 ? (
          <p className="cyber-body-muted">
            Analyze a resume to unlock coaching suggestions.
          </p>
        ) : (
          recommendations.slice(0, 3).map((item) => (
            <div
              key={item}
              className="flex gap-2 border border-cyber-border bg-cyber-muted px-3 py-2.5 font-mono text-sm text-cyber-fg cyber-chamfer-sm"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyber-accent" strokeWidth={1.5} />
              {item}
            </div>
          ))
        )}
      </div>
    </section>
  )
}
