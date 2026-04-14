import {
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

import { PublicShell } from '@/components/layout-shell'
import { ModernStunningSignIn } from '@/components/ui/modern-stunning-sign-in'

export function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <PublicShell>
      {/* Minimal top bar */}
      <nav className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center px-6 py-5 sm:px-8">
        <a
          href="/"
          className="flex items-baseline gap-0.5 transition-opacity hover:opacity-80"
        >
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Vaultic
          </span>
          <span className="text-[10px] font-medium tracking-wider text-accent">®</span>
        </a>
      </nav>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 fill-mode-both">
          <SignedIn>
            <Navigate to="/library" replace />
          </SignedIn>

          <SignedOut>
            <ModernStunningSignIn />
          </SignedOut>
        </div>
      </main>
    </PublicShell>
  )
}
