import { Badge } from '../ui/Badge'
import { ProgressRing } from '../ui/ProgressRing'

type CareerScoreProps = {
  score: number
  roles: string[]
  strengths: string[]
  growth: string[]
}

export function CareerScore({
  score,
  roles,
  strengths,
  growth,
}: CareerScoreProps) {
  return (
    <section className="cyber-card p-5 sm:p-7">
      <p className="cyber-label text-cyber-accent-tertiary">// career compatibility</p>
      <div className="mt-5 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="mx-auto text-center">
          <ProgressRing value={score} size={160} strokeWidth={8} sublabel="MATCH" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <ChipGroup title="Recommended Roles" items={roles} variant="accent" />
          <ChipGroup title="Top Strengths" items={strengths} variant="success" />
          <ChipGroup title="Growth Areas" items={growth} variant="warning" />
        </div>
      </div>
    </section>
  )
}

function ChipGroup({
  title,
  items,
  variant,
}: {
  title: string
  items: string[]
  variant: 'accent' | 'success' | 'warning'
}) {
  return (
    <div>
      <p className="cyber-label">{title}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <li className="cyber-body-muted">Pending signal</li>
        ) : (
          items.map((item) => (
            <li key={item}>
              <Badge variant={variant}>{item}</Badge>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
