import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StaggeredContainerProps {
  children: ReactNode
  className?: string
  delay?: number
  stagger?: number
}

const containerVariants = {
  hidden: {},
  visible: (custom: { delay: number; stagger: number }) => ({
    transition: {
      staggerChildren: custom.stagger,
      delayChildren: custom.delay,
    },
  }),
}

export const staggeredItemVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
      mass: 1,
    },
  },
}

export function StaggeredContainer({
  children,
  className,
  delay = 0,
  stagger = 0.06,
}: StaggeredContainerProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={{ delay, stagger }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export function StaggeredItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div variants={staggeredItemVariants} className={cn(className)}>
      {children}
    </motion.div>
  )
}
