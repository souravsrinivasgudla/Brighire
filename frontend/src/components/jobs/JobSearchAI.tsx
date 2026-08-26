import { Search, Sparkles } from 'lucide-react'

import { Button } from '../ui/Button'

const FILTERS = [
  'Remote',
  'Hybrid',
  'Full Time',
  'Startup',
  'Enterprise',
] as const

type JobSearchAIProps = {
  query: string
  onQueryChange: (value: string) => void
  onSearch: () => void
  activeFilters: string[]
  onToggleFilter: (filter: string) => void
}

export function JobSearchAI({
  query,
  onQueryChange,
  onSearch,
  activeFilters,
  onToggleFilter,
}: JobSearchAIProps) {
  return (
    <section className="cyber-card p-4 sm:p-5">
      <label className="sr-only" htmlFor="ai-job-search">
        AI job search
      </label>
      <div className="relative">
        <Sparkles
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyber-accent"
          strokeWidth={1.5}
        />
        <input
          id="ai-job-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch()
          }}
          placeholder="Find roles where my backend and cloud skills are valuable"
          className="w-full border border-cyber-border bg-cyber-bg py-3.5 pl-11 pr-28 font-mono text-sm text-cyber-fg placeholder:text-cyber-muted-fg outline-none transition focus:border-cyber-accent focus:shadow-[var(--box-shadow-neon-sm)] cyber-chamfer-sm"
        />
        <Button
          type="button"
          variant="glitch"
          size="sm"
          onClick={onSearch}
          leftIcon={<Search className="h-3.5 w-3.5" strokeWidth={1.5} />}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          Search
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filters">
        {FILTERS.map((filter) => {
          const active = activeFilters.includes(filter)
          return (
            <button
              key={filter}
              type="button"
              onClick={() => onToggleFilter(filter)}
              className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition cyber-chamfer-sm cyber-focus ${
                active
                  ? 'border-cyber-accent bg-cyber-accent/10 text-cyber-accent shadow-[var(--box-shadow-neon-sm)]'
                  : 'border-cyber-border bg-cyber-muted text-cyber-muted-fg hover:border-cyber-accent hover:text-cyber-accent'
              }`}
              aria-pressed={active}
            >
              {filter}
            </button>
          )
        })}
      </div>
    </section>
  )
}
