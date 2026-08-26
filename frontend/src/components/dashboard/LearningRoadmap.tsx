import { SectionHeading } from '../ui/SectionHeading'

const steps = [
  { title: 'Docker', detail: 'Container fundamentals' },
  { title: 'Kubernetes', detail: 'Orchestration mastery' },
  { title: 'Terraform', detail: 'Infrastructure as code' },
  { title: 'AWS EKS', detail: 'Managed production clusters' },
]

export function LearningRoadmap() {
  return (
    <section id="learning-roadmap" className="scroll-mt-6 cyber-card p-5 sm:p-6">
      <SectionHeading
        eyebrow="// learning roadmap"
        tone="tertiary"
        title="Current Level: Backend Engineer"
        description="Next skills the AI recommends to unlock higher-fit roles."
      />

      <ol className="relative mt-8 space-y-4">
        <div
          className="absolute bottom-4 left-4 top-4 w-px -translate-x-1/2 bg-cyber-border"
          aria-hidden="true"
        />
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex items-start gap-4">
            <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center border border-cyber-accent/40 bg-cyber-bg font-mono text-xs font-bold text-cyber-accent cyber-chamfer-sm shadow-[var(--box-shadow-neon-sm)]">
              {i + 1}
            </span>
            <div>
              <p className="cyber-h3 text-sm">{step.title}</p>
              <p className="mt-1 cyber-body-muted">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
