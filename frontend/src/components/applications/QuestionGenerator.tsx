import { motion, useReducedMotion } from 'framer-motion'

export type InterviewQuestion = {
  id: string
  category: 'Technical' | 'Behavioral' | 'System Design' | 'Company Specific'
  prompt: string
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced'
  topics: string[]
}

const BANK: InterviewQuestion[] = [
  {
    id: '1',
    category: 'System Design',
    prompt: 'How would you design a scalable resume processing system?',
    difficulty: 'Advanced',
    topics: ['Queue systems', 'Storage', 'Caching', 'Scaling'],
  },
  {
    id: '2',
    category: 'Technical',
    prompt: 'Explain how you designed a scalable API system.',
    difficulty: 'Intermediate',
    topics: ['REST', 'Auth', 'Throughput', 'Observability'],
  },
  {
    id: '3',
    category: 'Behavioral',
    prompt: 'Tell me about a time you resolved a production incident under pressure.',
    difficulty: 'Intermediate',
    topics: ['Ownership', 'Communication', 'Postmortems'],
  },
  {
    id: '4',
    category: 'Company Specific',
    prompt: 'Why are you a strong fit for this team\'s cloud platform roadmap?',
    difficulty: 'Foundation',
    topics: ['Motivation', 'Role alignment', 'Impact'],
  },
]

type QuestionGeneratorProps = {
  mode: string
  selected: InterviewQuestion | null
  onSelect: (q: InterviewQuestion) => void
}

export function QuestionGenerator({
  mode,
  selected,
  onSelect,
}: QuestionGeneratorProps) {
  const reduceMotion = useReducedMotion()
  const filtered =
    mode === 'system'
      ? BANK.filter((q) => q.category === 'System Design')
      : mode === 'hr'
        ? BANK.filter((q) => q.category === 'Behavioral')
        : mode === 'technical'
          ? BANK.filter((q) => q.category === 'Technical')
          : BANK

  return (
    <div className="cyber-card p-4">
      <p className="cyber-label">AI Question Generator</p>
      <ul className="mt-3 space-y-3">
        {filtered.map((q, i) => (
          <motion.li
            key={q.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
          >
            <button
              type="button"
              onClick={() => onSelect(q)}
              className={`w-full border p-3 text-left transition cyber-chamfer-sm cyber-focus ${
                selected?.id === q.id
                  ? 'border-cyber-accent bg-cyber-accent/10'
                  : 'border-cyber-border bg-cyber-muted hover:border-cyber-accent/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="cyber-label text-[10px] text-cyber-accent">
                  {q.category}
                </span>
                <span className="font-mono text-[10px] font-semibold text-cyber-accent-secondary">
                  {q.difficulty}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-cyber-fg">{q.prompt}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {q.topics.map((t) => (
                  <span
                    key={t}
                    className="border border-cyber-border px-2 py-0.5 font-mono text-[10px] text-cyber-muted-fg cyber-chamfer-sm"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}
