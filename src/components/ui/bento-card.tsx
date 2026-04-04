import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BentoCardProps {
  name: string
  linkCount: number
  span?: 1 | 2
  onClick?: () => void
  className?: string
}

export function BentoCard({
  name,
  linkCount,
  span = 1,
  onClick,
  className,
}: BentoCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.015, y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={cn(
        'frosted-obsidian glass-to-glow group relative cursor-pointer overflow-hidden rounded-2xl p-6 text-left transition-all duration-300',
        span === 2 ? 'sm:col-span-2' : '',
        className,
      )}
    >
      {/* Accent line */}
      <div className="absolute left-0 top-0 h-full w-[2px] bg-gradient-to-b from-accent/40 via-accent/10 to-transparent transition-all duration-500 group-hover:w-[3px] group-hover:from-accent/70" />

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-display text-xl font-medium tracking-tight text-foreground transition-colors group-hover:text-accent sm:text-2xl">
          {name}
        </h3>

        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono text-sm tracking-widest text-muted-foreground">
            {String(linkCount).padStart(2, '0')}
          </span>
          <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground/60">
            artifacts
          </span>
        </div>
      </div>

      {/* Background glow on hover */}
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-accent/0 blur-3xl transition-all duration-700 group-hover:bg-accent/5" />
    </motion.button>
  )
}
