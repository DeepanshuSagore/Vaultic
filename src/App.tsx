import {
  RedirectToSignIn,
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/clerk-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Link, Navigate, Route, Routes } from 'react-router-dom'

const navLinks = ['Home', 'Studio', 'About', 'Journal', 'Reach Us']

const videoSource =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260330_145725_08886141-ed95-4a8e-8d6d-b75eaadce638.mp4'

const clerkAppearance = {
  variables: {
    colorPrimary: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: 'hsl(240 4% 66%)',
    colorBackground: 'transparent',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '20px',
  },
  elements: {
    card: 'bg-transparent border-0 shadow-none',
    rootBox: 'w-full',
    headerTitle: 'text-2xl',
    headerSubtitle: 'text-muted-foreground',
    socialButtonsBlockButton:
      'liquid-glass rounded-full h-12 text-sm text-foreground hover:scale-[1.03] transition-transform border-0',
    socialButtonsBlockButtonText: 'font-medium',
    dividerLine: 'hidden',
    dividerText: 'hidden',
    footerAction: 'text-muted-foreground',
    footerActionLink: 'text-foreground hover:text-muted-foreground',
    formFieldInput:
      'rounded-full border border-border bg-transparent text-foreground',
  },
}

function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={videoSource} type="video/mp4" />
      </video>

      <div className="relative z-10 flex min-h-screen flex-col">
        <nav className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6">
          <Link
            to="/"
            className="text-3xl tracking-tight text-foreground"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Velorah<sup className="text-xs">&reg;</sup>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const isActive = link === 'Home'

              return (
                <li key={link}>
                  <a
                    href="#"
                    className={`text-sm transition-colors ${
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link}
                  </a>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-3">
            <SignedOut>
              <Button
                asChild
                variant="ghost"
                className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:scale-[1.03] hover:bg-transparent"
              >
                <Link to="/sign-in">Begin Journey</Link>
              </Button>
            </SignedOut>

            <SignedIn>
              <Button
                asChild
                variant="ghost"
                className="liquid-glass rounded-full px-5 py-2.5 text-sm text-foreground hover:scale-[1.03] hover:bg-transparent"
              >
                <Link to="/vault">Open Vault</Link>
              </Button>

              <div className="liquid-glass rounded-full px-2 py-1">
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </nav>

        {children}
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <SiteShell>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pt-32 pb-40 py-22.5 text-center">
        <h1
          className="animate-fade-rise max-w-7xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] sm:text-7xl md:text-8xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Where <em className="not-italic text-muted-foreground">dreams</em>{' '}
          rise{' '}
          <em className="not-italic text-muted-foreground">through the silence.</em>
        </h1>

        <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          We're designing tools for deep thinkers, bold creators, and quiet
          rebels. Amid the chaos, we build digital spaces for sharp focus and
          inspired work.
        </p>

        <Button
          asChild
          variant="ghost"
          className="liquid-glass animate-fade-rise-delay-2 mt-12 cursor-pointer rounded-full px-14 py-5 text-base text-foreground hover:scale-[1.03] hover:bg-transparent"
        >
          <Link to="/sign-in">Begin Journey</Link>
        </Button>
      </main>
    </SiteShell>
  )
}

function AuthPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  return (
    <SiteShell>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-22.5 text-center">
        <div className="w-full max-w-xl animate-fade-rise">
          <h1
            className="text-5xl font-normal leading-[0.95] tracking-[-2.46px] sm:text-6xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {mode === 'sign-in'
              ? 'Continue your journey.'
              : 'Create your private vault.'}
          </h1>

          <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Google-only access. Fast, secure, and aligned with your cinematic
            Vaultic flow.
          </p>

          <div className="liquid-glass mx-auto mt-10 w-full max-w-md rounded-4xl p-6 sm:p-8">
            <SignedIn>
              <Navigate to="/vault" replace />
            </SignedIn>

            <SignedOut>
              {mode === 'sign-in' ? (
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  forceRedirectUrl="/vault"
                  appearance={clerkAppearance}
                />
              ) : (
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  forceRedirectUrl="/vault"
                  appearance={clerkAppearance}
                />
              )}
            </SignedOut>
          </div>
        </div>
      </main>
    </SiteShell>
  )
}

function VaultPage() {
  return (
    <SiteShell>
      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-22.5 text-center">
        <div className="liquid-glass w-full max-w-4xl rounded-4xl px-6 py-14 sm:px-10">
          <h1
            className="text-5xl font-normal leading-[0.95] tracking-[-2.46px] sm:text-7xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Your vault is ready.
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Next, we will connect MongoDB and start adding categories and saved
            websites.
          </p>
        </div>
      </main>
    </SiteShell>
  )
}

function ProtectedVaultPage() {
  return (
    <>
      <SignedIn>
        <VaultPage />
      </SignedIn>

      <SignedOut>
        <RedirectToSignIn redirectUrl="/vault" />
      </SignedOut>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />
      <Route path="/vault" element={<ProtectedVaultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
