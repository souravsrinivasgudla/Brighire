const PATH = [
  { when: 'Current', title: 'Backend Developer' },
  { when: '6 Months', title: 'Cloud Engineer' },
  { when: '12 Months', title: 'DevOps Engineer' },
]

export function CareerForecast() {
  return (
    <section className="cyber-card p-5">
      <p className="cyber-label text-cyber-accent-secondary">// career path prediction</p>
      <h2 className="cyber-h3 mt-1">Your Possible Career Evolution</h2>

      <ol className="relative mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
        <div
          className="absolute left-4 top-4 hidden h-px w-[calc(100%-2rem)] bg-cyber-border sm:left-[8%] sm:block sm:w-[84%]"
          aria-hidden="true"
        />
        {PATH.map((step, i) => (
          <li
            key={step.when}
            className="relative z-10 flex flex-1 flex-col items-start sm:items-center sm:text-center"
          >
            <span className="flex h-8 w-8 items-center justify-center border border-cyber-accent/40 bg-cyber-bg font-mono text-xs font-bold text-cyber-accent cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)]">
              {i + 1}
            </span>
            <p className="mt-3 cyber-label">{step.when}</p>
            <p className="mt-1 cyber-h3 text-sm">{step.title}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
