import { useSignIn } from '@clerk/clerk-react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export function ModernStunningSignIn() {
  const { signIn, isLoaded } = useSignIn()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = () => {
    if (!isLoaded) return

    setIsLoading(true)
    signIn
      .authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/library',
      })
      .catch(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="w-full relative overflow-hidden rounded-xl flex flex-col items-center">
      {/* Centered glass card */}
      <div className="frosted-obsidian relative z-10 w-full max-w-sm rounded-[2rem] p-8 pb-10 flex flex-col items-center border border-white/[0.05] shadow-[0_0_80px_rgba(232,195,94,0.03)]">
        {/* Sub-gradient glow inside card */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-accent/5 to-transparent rounded-[2rem] pointer-events-none" />

        <div className="relative z-10 flex flex-col w-full items-center">
          {/* Logo */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6 shadow-xl backdrop-blur-md">
            {/* Minimal abstract 'V' placeholder for Vaultic */}
            <div className="flex items-baseline gap-0.5">
              <span className="font-display text-xl font-semibold tracking-tight text-accent">
                V
              </span>
            </div>
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl font-semibold text-foreground mb-8 text-center tracking-tight">
            Vaultic
          </h2>

          {/* Form Area */}
          <div className="flex flex-col w-full gap-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-full px-5 py-3.5 font-medium text-foreground shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5 transition-transform group-hover:scale-110"
                />
              )}
              <span className="text-sm tracking-wide">Continue with Google</span>
            </button>

            <div className="w-full text-center mt-3">
              <span className="text-xs text-muted-foreground">
                By continuing, you agree to Vaultic&apos;s Terms of Service.
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
