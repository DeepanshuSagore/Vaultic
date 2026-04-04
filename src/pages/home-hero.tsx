import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { PublicShell } from '@/components/layout-shell'

export function HomeHero() {
  return (
    <PublicShell>
      {/* Top bar — minimal */}
      <nav className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 sm:px-8">
        <div className="flex items-baseline gap-0.5">
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Vaultic
          </span>
          <span className="text-[10px] font-medium tracking-wider text-accent">®</span>
        </div>

        <Link
          to="/sign-in"
          className="frosted-obsidian rounded-xl px-5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Enter Vault
        </Link>
      </nav>

      {/* Hero content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Title with scanning line */}
        <div className="relative">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-6xl font-semibold leading-[0.95] tracking-[0.04em] text-foreground sm:text-8xl md:text-9xl"
          >
            VAULTIC
          </motion.h1>

          {/* Scanning line */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 1.8,
              delay: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <div className="absolute inset-y-0 w-[60%] bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
          </motion.div>
        </div>

        {/* Tagline — staggered letter reveal */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 font-mono text-sm font-light tracking-[0.35em] uppercase text-muted-foreground sm:text-base"
        >
          Your private digital sanctuary
        </motion.p>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground/70 sm:text-base"
        >
          Organize, protect, and curate your most valuable links in a premium vault experience
          built for deep thinkers and bold creators.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="mt-12"
        >
          <Link to="/sign-in">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="frosted-obsidian group relative cursor-pointer overflow-hidden rounded-2xl border border-accent/20 px-10 py-4 text-sm font-medium tracking-[0.15em] uppercase text-foreground transition-all hover:border-accent/40 hover:shadow-[0_0_40px_rgba(232,195,94,0.08)]"
            >
              Enter Vault
              {/* Glow pulse */}
              <div className="animate-glow-pulse pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-accent/15 blur-2xl" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Bottom accent line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 h-[0.5px] w-48 bg-gradient-to-r from-transparent via-accent/30 to-transparent"
        />
      </main>
    </PublicShell>
  )
}
