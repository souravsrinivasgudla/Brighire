import { AICoachPanel } from '../components/dashboard/AICoachPanel'
import { PageHeader } from '../components/PageHeader'

export function AICoachPage() {
  return (
    <div className="flex min-h-full flex-col text-cyber-fg">
      <PageHeader
        eyebrow="// brighthire ai"
        title="Career Copilot"
        description="Ask the engine anything about your resume, skill gaps, or matched roles."
      />
      <div className="min-h-[520px] flex-1">
        <AICoachPanel />
      </div>
    </div>
  )
}
