import { SignOutButton, useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'

import { MotionButton } from '@/components/ui/button'
import {
  StaggeredContainer,
  StaggeredItem,
} from '@/components/ui/staggered-container'

export function ProfilePage() {
  const { user } = useUser()
  const [calmMode, setCalmMode] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = window.localStorage.getItem('vaultic-calm-mode')
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('vaultic-calm-mode', String(calmMode))
  }, [calmMode])

  return (
    <div className="mx-auto max-w-2xl">
      <StaggeredContainer>
        <StaggeredItem>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Profile
          </p>
        </StaggeredItem>

        <StaggeredItem>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground">
            Identity
          </h1>
        </StaggeredItem>
      </StaggeredContainer>

      <StaggeredContainer delay={0.2} className="mt-8 space-y-4">
        {/* Name */}
        <StaggeredItem>
          <div className="frosted-obsidian rounded-2xl p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
              Name
            </p>
            <p className="mt-1.5 text-lg font-medium text-foreground">
              {user?.fullName || user?.firstName || 'Vaultic Member'}
            </p>
          </div>
        </StaggeredItem>

        {/* Email */}
        <StaggeredItem>
          <div className="frosted-obsidian rounded-2xl p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
              Email
            </p>
            <p className="mt-1.5 font-mono text-sm tracking-wide text-foreground">
              {user?.primaryEmailAddress?.emailAddress || 'No email'}
            </p>
          </div>
        </StaggeredItem>

        {/* Calm mode */}
        <StaggeredItem>
          <div className="frosted-obsidian flex items-center justify-between rounded-2xl p-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
                Ambient Mode
              </p>
              <p className="mt-1 text-sm text-foreground">
                Cinematic constellation background
              </p>
            </div>

            <motion.button
              type="button"
              onClick={() => setCalmMode(!calmMode)}
              whileTap={{ scale: 0.95 }}
              className={`relative h-7 w-12 rounded-full transition-colors duration-300 ${
                calmMode ? 'bg-accent/30' : 'bg-white/10'
              }`}
            >
              <motion.div
                animate={{ x: calmMode ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`h-5 w-5 rounded-full transition-colors ${
                  calmMode ? 'bg-accent' : 'bg-muted-foreground'
                }`}
                style={{ marginTop: 4 }}
              />
            </motion.button>
          </div>
        </StaggeredItem>

        {/* Sign out */}
        <StaggeredItem>
          <div className="pt-4">
            <SignOutButton>
              <MotionButton variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </MotionButton>
            </SignOutButton>
          </div>
        </StaggeredItem>
      </StaggeredContainer>
    </div>
  )
}
