import { Badge } from '../ui/Badge'
import { ProgressRing } from '../ui/ProgressRing'
import { SectionHeading, SectionLink } from '../ui/SectionHeading'

type CareerOverviewProps = {
  score: number
  strongSkills: string[]
  improveSkills: string[]
  summary: string
  primaryFilename?: string | null
}

export function CareerOverview({
  score,
  strongSkills,
  improveSkills,
  summary,
  primaryFilename,
}: CareerOverviewProps) {
  return (
    <section className="cyber-card p-5 sm:p-7">
      <SectionHeading
        eyebrow="// career intelligence"
        tone="tertiary"
        title="Where You Stand"
        description={
          primaryFilename
            ? `Driven by your primary resume: ${primaryFilename}`
            : 'Set a primary resume so this dashboard tracks a single profile.'
        }
        action={<SectionLink to="/resumes">Manage resumes</SectionLink>}
        className="mb-6"
      />

      <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
        <div className="flex flex-col items-center">
          <p className="mb-3 cyber-label">Career Score</p>
          <ProgressRing value={score} size={160} strokeWidth={8} sublabel="SCORE" />
        </div>

        <div className="space-y-5">
          <p className="font-mono text-base leading-relaxed text-cyber-fg sm:text-lg">
            {summary}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="cyber-label text-cyber-accent">Strong Skills</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {strongSkills.length === 0 ? (
                  <li className="cyber-body-muted">Upload a resume to detect skills</li>
                ) : (
                  strongSkills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="accent">{skill}</Badge>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="cyber-label text-cyber-accent-tertiary">Improve</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {improveSkills.length === 0 ? (
                  <li className="cyber-body-muted">No gaps detected yet</li>
                ) : (
                  improveSkills.map((skill) => (
                    <li key={skill}>
                      <Badge variant="warning">{skill}</Badge>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
