import { CareerDNA } from '../components/dashboard/CareerDNA'
import { PageHeader } from '../components/PageHeader'
import { useAuth } from '../hooks/useAuth'

export function CareerDnaPage() {
  const { user } = useAuth()
  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="text-cyber-fg">
      <PageHeader
        eyebrow="// career dna"
        title="Career Fingerprint"
        description="A generated map of how your skills, projects, experience and goals connect."
      />
      <CareerDNA initials={initials} />
    </div>
  )
}
