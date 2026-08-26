import { SectionHeading } from '../ui/SectionHeading'

type CareerDNAProps = {
  role: string
  experience: string
  level: string
  skills: string[]
}

/**
 * Each facet sits in one cell of a 3x3 grid. The x/y pair is the cell centre in
 * percent, which is where its spoke has to land, so the two stay in sync.
 */
type Facet = {
  id: string
  label: string
  value: string
  cell: string
  x: number
  y: number
}

const CELL_CENTRE_LOW = 16.7
const CELL_CENTRE_HIGH = 83.3

export function CareerDNAPanel({
  role,
  experience,
  level,
  skills,
}: CareerDNAProps) {
  const facets: Facet[] = [
    {
      id: 'role',
      label: 'Role',
      value: role,
      cell: '@sm:col-start-2 @sm:row-start-1',
      x: 50,
      y: CELL_CENTRE_LOW,
    },
    {
      id: 'experience',
      label: 'Experience',
      value: experience,
      cell: '@sm:col-start-3 @sm:row-start-2',
      x: CELL_CENTRE_HIGH,
      y: 50,
    },
    {
      id: 'level',
      label: 'Level',
      value: level,
      cell: '@sm:col-start-2 @sm:row-start-3',
      x: 50,
      y: CELL_CENTRE_HIGH,
    },
    {
      id: 'skills',
      label: 'Skills',
      value: skills.length ? `${skills.length} detected` : 'None detected',
      cell: '@sm:col-start-1 @sm:row-start-2',
      x: CELL_CENTRE_LOW,
      y: 50,
    },
  ]

  return (
    <div className="cyber-card @container p-5">
      <SectionHeading eyebrow="AI Career DNA" title="Extracted career profile" />

      <div className="relative mt-4 @sm:mx-auto @sm:max-w-[340px]">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 hidden h-full w-full @sm:block"
          aria-hidden="true"
        >
          {facets.map((facet) => (
            <line
              key={facet.id}
              x1="50"
              y1="50"
              x2={facet.x}
              y2={facet.y}
              stroke="#00ff88"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              opacity="0.45"
            />
          ))}
        </svg>

        <dl className="grid gap-2 @sm:aspect-square @sm:grid-cols-3 @sm:grid-rows-3">
          {facets.map((facet) => (
            <div
              key={facet.id}
              className={`relative border border-cyber-border bg-cyber-muted px-3 py-2 cyber-chamfer-sm @sm:flex @sm:flex-col @sm:justify-center ${facet.cell}`}
            >
              <dt className="cyber-label text-[10px]">{facet.label}</dt>
              <dd className="mt-0.5 break-words text-xs font-semibold text-cyber-fg">
                {facet.value}
              </dd>
            </div>
          ))}

          <div
            className="relative hidden h-16 w-16 items-center justify-center rounded-full border border-cyber-accent bg-cyber-card font-display text-xs font-bold tracking-[0.15em] text-cyber-accent shadow-[var(--box-shadow-neon-sm)] @sm:col-start-2 @sm:row-start-2 @sm:flex @sm:place-self-center"
            aria-hidden="true"
          >
            YOU
          </div>
        </dl>
      </div>

      <div className="mt-4 border border-cyber-border bg-cyber-muted px-3 py-2 cyber-chamfer-sm">
        <p className="cyber-label text-[10px]">Primary Skills</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {skills.length === 0 ? (
            <span className="text-sm text-cyber-muted-fg">Skills pending</span>
          ) : (
            skills.slice(0, 6).map((skill) => (
              <span
                key={skill}
                className="border border-cyber-accent/30 bg-cyber-accent/10 px-2 py-0.5 text-xs text-cyber-accent cyber-chamfer-sm"
              >
                {skill}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
