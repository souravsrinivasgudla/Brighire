import { AIResumeChat } from './AIResumeChat'
import { AIScanner } from './AIScanner'
import { ATSScore } from './ATSScore'
import { CareerDNAPanel } from './CareerDNA'
import { RecommendationPanel } from './RecommendationPanel'
import { ResumeComparison } from './ResumeComparison'
import { ResumeToolbar } from './ResumeToolbar'
import { SkillGapMap } from './SkillGapMap'
import { VersionHistory } from './VersionHistory'
import type { Resume, ResumeAnalysis } from '../../types/api'

type ResumeWorkspaceProps = {
  resume: Resume
  analysis: ResumeAnalysis | null
  analyzing: boolean
  versions: Resume[]
  versionScores: Record<string, number | undefined>
  onAnalyze: () => void
  onReplace: (file: File) => void
}

function inferRole(analysis: ResumeAnalysis | null, text: string | null) {
  if (analysis?.summary) {
    const match = analysis.summary.match(
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\s+(?:Engineer|Developer|Designer|Analyst|Manager))\b/,
    )
    if (match) return match[1]
  }
  if (text?.toLowerCase().includes('devops')) return 'DevOps Engineer'
  if (text?.toLowerCase().includes('frontend')) return 'Frontend Engineer'
  if (text?.toLowerCase().includes('backend')) return 'Backend Engineer'
  return 'Professional'
}

function inferLevel(score: number | null) {
  if (score == null) return 'Emerging'
  if (score >= 85) return 'Senior-leaning'
  if (score >= 70) return 'Mid-Level'
  return 'Early Career'
}

export function ResumeWorkspace({
  resume,
  analysis,
  analyzing,
  versions,
  versionScores,
  onAnalyze,
  onReplace,
}: ResumeWorkspaceProps) {
  const complete = !!analysis
  const score = analysis?.overall_score ?? 0
  const ats = complete ? Math.min(99, score + 3) : 0
  const skill = complete ? Math.min(99, Math.round(score * 0.94)) : 0
  const impact = complete ? score : 0

  const before =
    'Worked on APIs and helped maintain backend services for the product team.'
  const after =
    analysis?.suggestions?.[0] != null
      ? 'Designed scalable REST APIs handling enterprise workloads with measurable reliability gains.'
      : 'Designed scalable REST APIs handling enterprise workloads with measurable reliability gains.'

  return (
    <div className="space-y-6">
      <div>
        <p className="cyber-label text-cyber-accent">// resume intelligence lab</p>
        <h1 className="cyber-h2 mt-1 text-2xl sm:text-3xl">
          AI Lab For Your Career Profile
        </h1>
      </div>

      <ResumeToolbar
        filename={resume.filename}
        text={resume.extracted_text}
        createdAt={resume.created_at}
        onReplace={onReplace}
      />

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <AIScanner
            analyzing={analyzing}
            complete={complete}
            ats={ats}
            skill={skill}
            impact={impact}
            onAnalyze={onAnalyze}
          />
          {complete ? (
            <>
              <ATSScore score={ats} />
              <CareerDNAPanel
                role={inferRole(analysis, resume.extracted_text)}
                experience={
                  analysis && analysis.skills.length > 6
                    ? '3+ years signal'
                    : 'Experience in progress'
                }
                level={inferLevel(analysis?.overall_score ?? null)}
                skills={analysis?.skills ?? []}
              />
            </>
          ) : null}
        </div>

        <RecommendationPanel
          strengths={analysis?.strengths ?? []}
          missingKeywords={analysis?.missing_skills ?? []}
          suggestions={analysis?.suggestions ?? []}
          optimizing={analyzing}
        />
      </div>

      {complete ? (
        <>
          <ResumeComparison before={before} after={after} />
          <div className="grid gap-5 lg:grid-cols-2">
            <SkillGapMap
              current={analysis?.skills ?? []}
              missing={analysis?.missing_skills ?? []}
            />
            <VersionHistory
              resumes={versions}
              activeId={resume.id}
              scores={versionScores}
            />
          </div>
        </>
      ) : (
        <VersionHistory
          resumes={versions}
          activeId={resume.id}
          scores={versionScores}
        />
      )}

      <AIResumeChat />
    </div>
  )
}
