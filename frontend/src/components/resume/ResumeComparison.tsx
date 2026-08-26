import { ArrowRight } from 'lucide-react'

type ResumeComparisonProps = {
  before: string
  after: string
}

export function ResumeComparison({ before, after }: ResumeComparisonProps) {
  return (
    <div className="cyber-card p-5">
      <p className="cyber-label">Before vs After Optimization</p>
      <h3 className="cyber-h3 mt-1">AI enhancement preview</h3>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="border border-cyber-destructive/30 bg-cyber-destructive/10 p-4 cyber-chamfer-sm">
          <p className="cyber-label text-cyber-destructive">Original Resume</p>
          <p className="mt-2 text-sm leading-relaxed text-cyber-fg">{before}</p>
        </div>
        <div className="flex justify-center" aria-hidden="true">
          <span className="inline-flex h-10 w-10 items-center justify-center border border-cyber-accent bg-cyber-accent text-cyber-bg shadow-[var(--box-shadow-neon-sm)] cyber-chamfer-sm">
            <ArrowRight className="h-4 w-4 cyber-icon" strokeWidth={1.5} />
          </span>
        </div>
        <div className="border border-cyber-accent/30 bg-cyber-accent/10 p-4 cyber-chamfer-sm">
          <p className="cyber-label text-cyber-accent">AI Enhanced Version</p>
          <p className="mt-2 text-sm leading-relaxed text-cyber-fg">{after}</p>
        </div>
      </div>
    </div>
  )
}
