import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export function FinalCTA() {
  const { isAuthenticated } = useAuth()
  const reduceMotion = useReducedMotion()
  const to = isAuthenticated ? '/dashboard' : '/register'

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="relative z-10 cyber-container max-w-4xl text-center">
        <motion.h2
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="cyber-h3 text-4xl sm:text-5xl md:text-6xl"
        >
          Ready to transform your career?
        </motion.h2>
        <p className="cyber-body-muted mx-auto mt-4 max-w-xl">
          Enter the BrightHire AI operating system and let intelligence steer
          your next move.
        </p>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <Link to={to}>
            <Button variant="glitch" size="lg" rightIcon={<ArrowRight className="h-5 w-5 cyber-icon" strokeWidth={1.5} />}>
              {isAuthenticated ? 'Open Dashboard' : 'Start Your AI Career Journey'}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
