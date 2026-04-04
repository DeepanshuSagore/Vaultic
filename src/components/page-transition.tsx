import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

const curtainVariants = {
  initial: { scaleY: 0 },
  animate: {
    scaleY: [0, 1, 1, 0],
    transition: {
      duration: 0.8,
      times: [0, 0.35, 0.65, 1],
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative"
      >
        {/* Curtain overlay */}
        <motion.div
          variants={curtainVariants}
          initial="initial"
          animate="animate"
          className="pointer-events-none fixed inset-0 z-[60] origin-bottom bg-[#050505]"
        />

        <motion.div variants={pageVariants}>{children}</motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
