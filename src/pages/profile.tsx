import { SignOutButton, useUser } from '@clerk/clerk-react'
import { LogOut } from 'lucide-react'

import { MotionButton } from '@/components/ui/button'
import {
  StaggeredContainer,
  StaggeredItem,
} from '@/components/ui/staggered-container'

export function ProfilePage() {
  const { user } = useUser()

  return (
    <div className="mx-auto max-w-2xl">
      <StaggeredContainer>
        <StaggeredItem>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Profile
          </p>
        </StaggeredItem>
      </StaggeredContainer>

      <StaggeredContainer delay={0.15} className="mt-8 space-y-4">
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
