type SkillMatchGraphProps = {
  yours: string[]
  required: string[]
}

export function SkillMatchGraph({ yours, required }: SkillMatchGraphProps) {
  const yourSet = new Set(yours.map((s) => s.toLowerCase()))
  const matched = required.filter((s) => yourSet.has(s.toLowerCase()))
  const missing = required.filter((s) => !yourSet.has(s.toLowerCase()))
  const bonus = yours.filter(
    (s) => !required.map((r) => r.toLowerCase()).includes(s.toLowerCase()),
  )

  return (
    <section className="cyber-card p-5">
      <p className="cyber-label text-cyber-accent-tertiary">// skill match</p>
      <h2 className="cyber-h3 mt-1">Your Skills vs Role Requirements</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
        <Column
          title="Your Skills"
          items={yours.length ? yours : ['Upload & analyze a resume']}
          tone="border-cyber-accent/30 bg-cyber-accent/10 text-cyber-accent"
        />
        <div className="hidden justify-center pt-8 md:flex" aria-hidden="true">
          <div className="flex flex-col gap-6">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-px w-12 bg-cyber-accent/50"
                style={{ boxShadow: '0 0 6px rgba(0,255,136,0.4)' }}
              />
            ))}
          </div>
        </div>
        <Column
          title="Required Skills"
          items={required.length ? required : ['Select a role']}
          tone="border-cyber-accent-tertiary/30 bg-cyber-accent-tertiary/10 text-cyber-accent-tertiary"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-wider">
        <Legend color="#00ff88" label={`Matched (${matched.length})`} />
        <Legend color="#ff3366" label={`Missing (${missing.length})`} />
        <Legend color="#00d4ff" label={`Extra strength (${bonus.length})`} />
      </div>
    </section>
  )
}

function Column({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: string
}) {
  return (
    <div>
      <p className="mb-2 cyber-label">{title}</p>
      <ul className="space-y-2">
        {items.slice(0, 6).map((item) => (
          <li
            key={item}
            className={`border px-3 py-2 font-mono text-sm font-semibold cyber-chamfer-sm ${tone}`}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-cyber-muted-fg">
      <span
        className="h-2 w-2"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {label}
    </span>
  )
}
