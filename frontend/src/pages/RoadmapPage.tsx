import { LearningRoadmap } from '../components/dashboard/LearningRoadmap'
import { PageHeader } from '../components/PageHeader'

export function RoadmapPage() {
  return (
    <div className="text-cyber-fg">
      <PageHeader
        eyebrow="// learning roadmap"
        title="Skill Progression"
        description="The next capabilities the engine recommends to unlock higher-fit roles."
      />
      <LearningRoadmap />
    </div>
  )
}
