import { motion, type HTMLMotionProps } from 'framer-motion'

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
}

export const slideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.25, ease: 'easeOut' as const },
}

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
}

export const MotionDiv = motion.div
export type MotionDivProps = HTMLMotionProps<'div'>
