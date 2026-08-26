import { motion, useReducedMotion } from 'framer-motion'
import { Bot } from 'lucide-react'
import { useEffect, useState } from 'react'

const MESSAGE =
  'Your resume is strong, but adding Terraform projects could increase DevOps opportunities by 24%.'

export function AICoach() {
  const reduceMotion = useReducedMotion()
  const [displayed, setDisplayed] = useState(reduceMotion ? MESSAGE : '')
  const [done, setDone] = useState(!!reduceMotion)

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(MESSAGE)
      setDone(true)
      return
    }
    let i = 0
    setDisplayed('')
    setDone(false)
    const id = window.setInterval(() => {
      i += 1
      setDisplayed(MESSAGE.slice(0, i))
      if (i >= MESSAGE.length) {
        window.clearInterval(id)
        setDone(true)
      }
    }, 28)
    return () => window.clearInterval(id)
  }, [reduceMotion])

  return (
    <section
      id="ai-coach"
      className="relative scroll-mt-28 overflow-hidden py-20 md:py-28"
    >
      <div className="relative z-10 cyber-container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="cyber-label">Layer 05 · Personal Career Assistant</p>
          <h2 className="cyber-h3 mt-3 text-3xl sm:text-4xl">
            An AI coach that talks like a mentor
          </h2>
          <p className="cyber-body-muted mt-3">
            Actionable guidance grounded in your Career DNA — not generic tips.
          </p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto mt-14 max-w-2xl"
        >
          <div className="cyber-card p-5 sm:p-8">
            <div className="mb-6 flex items-center gap-3 border-b border-cyber-border pb-4">
              <div className="relative">
                <span className="flex h-11 w-11 items-center justify-center border border-cyber-accent bg-cyber-muted text-cyber-accent cyber-chamfer-sm">
                  <Bot className="h-5 w-5 cyber-icon" strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-cyber-accent ring-2 ring-cyber-card">
                  <span className="absolute inset-0 animate-ping rounded-full bg-cyber-accent/60" />
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-cyber-fg">BrightHire Coach</p>
                <p className="cyber-body-muted text-xs">Online · calibrated to you</p>
              </div>
            </div>

            <div className="border border-cyber-border bg-cyber-bg p-4 text-left cyber-chamfer-sm sm:p-5">
              <p className="text-sm leading-relaxed text-cyber-fg sm:text-base">
                {displayed}
                {!done ? (
                  <span className="cyber-cursor ml-0.5 inline-block align-middle" />
                ) : null}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
