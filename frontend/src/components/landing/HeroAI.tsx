import { useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'
import { AIStatus } from '../ui/AIStatus'
import { ProgressRing } from '../ui/ProgressRing'
import { Badge } from '../ui/Badge'
import { HolographicCorners } from '../ui/CyberShell'

function useTypewriter(words: string[], reduceMotion: boolean | null) {
  const [index, setIndex] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (reduceMotion) {
      setText(words[0] ?? '')
      return
    }
    const word = words[index % words.length]
    const delay = deleting ? 40 : 70
    const timer = window.setTimeout(() => {
      if (!deleting && text === word) {
        window.setTimeout(() => setDeleting(true), 1400)
        return
      }
      if (deleting && text === '') {
        setDeleting(false)
        setIndex((i) => i + 1)
        return
      }
      setText(deleting ? word.slice(0, text.length - 1) : word.slice(0, text.length + 1))
    }, delay)
    return () => window.clearTimeout(timer)
  }, [text, deleting, index, words, reduceMotion])

  return text
}

export function HeroAI() {
  const { isAuthenticated } = useAuth()
  const reduceMotion = useReducedMotion()
  const typed = useTypewriter(
    ['AI CAREER ASSISTANT', 'RESUME INTELLIGENCE', 'JOB MATCHING ENGINE'],
    reduceMotion,
  )
  const primary = isAuthenticated ? '/dashboard' : '/register'

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-16">
      <div className="cyber-container relative z-10 grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="space-y-8 text-left">
          <AIStatus state="online" label="SYSTEM ONLINE" />

          <h1
            className="cyber-h1 cyber-glitch cyber-glitch-static max-w-3xl"
            data-text="YOUR CAREER, HACKED FOR GROWTH"
          >
            YOUR CAREER,
            <br />
            <span className="cyber-text-accent">HACKED</span> FOR GROWTH
          </h1>

          <p className="flex min-h-8 max-w-xl items-center gap-2 font-mono text-sm text-cyber-muted-fg sm:text-base">
            <span className="text-cyber-accent">&gt;</span>
            <span>{typed}</span>
            {!reduceMotion ? (
              <span className="inline-block h-5 w-0.5 animate-pulse bg-cyber-accent" aria-hidden="true" />
            ) : null}
          </p>

          <p className="max-w-lg font-mono text-sm leading-relaxed text-cyber-muted-fg">
            BrightHire AI is your underground career intelligence terminal — scan resumes,
            decode job signals, and deploy applications with precision.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to={primary}>
              <Button variant="glitch" size="lg" rightIcon={<ArrowRight className="h-4 w-4" strokeWidth={1.5} />}>
                Jack In
              </Button>
            </Link>
            <a href="#resume-scanner">
              <Button variant="outline" size="lg">
                Explore Terminal
              </Button>
            </a>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="cyber-card-holographic cyber-corner-accents relative p-6 -rotate-1">
            <HolographicCorners />
            <div className="mb-5 flex items-center justify-between border-b border-cyber-border pb-4">
              <div>
                <p className="cyber-label text-cyber-accent-tertiary">// command_center.exe</p>
                <p className="cyber-h3 mt-1 text-sm">Resume Intel Live</p>
              </div>
              <AIStatus state="analyzing" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <ProgressRing value={94} sublabel="SCORE" />
              <ProgressRing value={89} sublabel="MATCH" />
              <div className="flex flex-col items-center justify-center border border-cyber-border bg-cyber-bg p-4 cyber-chamfer-sm">
                <p className="font-display text-4xl font-black text-cyber-accent">27</p>
                <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-cyber-muted-fg">
                  Skills
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {['ATS READY', 'CLOUD STACK', 'LEADERSHIP', 'IMPACT'].map((label) => (
                <Badge key={label} variant="accent">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
