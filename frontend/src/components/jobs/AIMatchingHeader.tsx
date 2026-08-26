import { AIStatus } from '../ui/AIStatus'

type AIMatchingHeaderProps = {
  opportunityCount: number
}

export function AIMatchingHeader({ opportunityCount }: AIMatchingHeaderProps) {
  const displayCount = Math.max(opportunityCount, 0).toLocaleString()

  return (
    <header className="flex flex-col gap-4 cyber-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <p className="cyber-label text-cyber-accent">// job intelligence</p>
        <h1 className="cyber-h3 mt-1 text-xl sm:text-2xl">AI Job Intelligence</h1>
        <p className="mt-1 font-mono text-sm text-cyber-muted-fg">
          Analyzing {displayCount} opportunities for your profile
        </p>
      </div>
      <AIStatus state="online" label="Matching Engine Active" className="self-start sm:self-auto" />
    </header>
  )
}
