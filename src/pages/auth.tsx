import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { Navigate } from 'react-router-dom'

import { PublicShell } from '@/components/layout-shell'

const clerkAppearance = {
  variables: {
    colorPrimary: '#e8c35e',
    colorText: '#f5f5f5',
    colorTextSecondary: 'hsl(0 0% 55%)',
    colorBackground: 'transparent',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '16px',
  },
  elements: {
    card: 'bg-transparent border-0 shadow-none',
    rootBox: 'w-full',
    headerTitle: 'text-2xl font-display tracking-tight',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButton:
      'frosted-obsidian rounded-xl h-12 text-sm text-foreground hover:scale-[1.02] transition-transform border-0',
    socialButtonsBlockButtonText: 'font-medium',
    dividerLine: 'hidden',
    dividerText: 'hidden',
    footerAction: 'text-muted-foreground',
    footerActionLink: 'text-accent hover:text-accent/80',
    formFieldInput:
      'rounded-xl border border-border-subtle bg-transparent text-foreground',
  },
}

export function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <PublicShell>
      {/* Minimal top bar */}
      <nav className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center px-6 py-5 sm:px-8">
        <a
          href="/"
          className="flex items-baseline gap-0.5"
        >
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Vaultic
          </span>
          <span className="text-[10px] font-medium tracking-wider text-accent">®</span>
        </a>
      </nav>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {mode === 'sign-in'
                ? 'Welcome back'
                : 'Create your vault'}
            </h1>
            <p className="mt-3 font-mono text-xs tracking-[0.2em] uppercase text-muted-foreground/60">
              {mode === 'sign-in' ? 'Resume your session' : 'Begin your journey'}
            </p>
          </div>

          {/* Scanning line across card */}
          <div className="frosted-obsidian relative overflow-hidden rounded-3xl p-6 sm:p-8">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '200%' }}
              transition={{
                duration: 2,
                delay: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="pointer-events-none absolute inset-0 z-20"
            >
              <div className="absolute inset-y-0 w-[40%] bg-gradient-to-r from-transparent via-accent/8 to-transparent" />
            </motion.div>

            <SignedIn>
              <Navigate to="/" replace />
            </SignedIn>

            <SignedOut>
              {mode === 'sign-in' ? (
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  forceRedirectUrl="/"
                  appearance={clerkAppearance}
                />
              ) : (
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  forceRedirectUrl="/"
                  appearance={clerkAppearance}
                />
              )}
            </SignedOut>
          </div>
        </motion.div>
      </main>
    </PublicShell>
  )
}
