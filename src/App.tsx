import {
  RedirectToSignIn,
  SignIn,
  SignOutButton,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
  useUser,
} from '@clerk/clerk-react'
import type { FormEvent, ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  VaultApiError,
  createCategory,
  createWebsite,
  listCategories,
  listWebsites,
  type VaultCategory,
  type VaultWebsite,
} from '@/lib/vault-api'
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/library', label: 'Library', end: false },
  { to: '/me', label: 'Me', end: false },
]

const videoSource =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4'

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

function getErrorMessage(error: unknown) {
  if (error instanceof VaultApiError || error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
}

async function getRequiredToken(getToken: () => Promise<string | null>) {
  const token = await getToken()

  if (!token) {
    throw new Error('Session expired. Please sign in again.')
  }

  return token
}

function hostFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

function faviconFromUrl(url: string) {
  const host = hostFromUrl(url)

  if (!host) {
    return ''
  }

  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
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
        <nav
          className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          <Link
            to="/"
            className="text-3xl tracking-tight text-foreground"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Vaultic<sup className="text-xs">&reg;</sup>
          </Link>

          <ul className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'text-sm transition-colors',
                      isActive
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
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

function HomeHero() {
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

function HomeDashboard() {
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [categories, setCategories] = useState<VaultCategory[]>([])
  const [recentLinks, setRecentLinks] = useState<VaultWebsite[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const token = await getRequiredToken(getToken)
      const [nextCategories, nextLinks] = await Promise.all([
        listCategories(token),
        listWebsites(token, { limit: 200 }),
      ])

      const counts = nextLinks.reduce<Record<string, number>>((acc, link) => {
        acc[link.categoryId] = (acc[link.categoryId] || 0) + 1
        return acc
      }, {})

      setCategories(nextCategories.slice(0, 6))
      setRecentLinks(nextLinks.slice(0, 6))
      setCategoryCounts(counts)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  return (
    <SiteShell>
      <main className="relative z-10 flex flex-1 px-6 pt-28 pb-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header className="animate-fade-rise text-center">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Home
            </p>
            <h1
              className="mt-3 text-4xl font-normal leading-[0.95] tracking-[-1.6px] sm:text-6xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              A calm space for what matters.
            </h1>
          </header>

          <section className="liquid-glass animate-fade-rise-delay rounded-4xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
                Your Categories
              </h2>
              <Button
                asChild
                variant="ghost"
                className="rounded-full border border-white/20 px-4 py-2 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
              >
                <Link to="/library">Open Library</Link>
              </Button>
            </div>

            {isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No categories yet. Create your first one in Library.
              </p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => navigate(`/library/${category._id}`)}
                    className="liquid-glass rounded-3xl px-4 py-4 text-left transition-all hover:scale-[1.01] hover:shadow-[0_0_24px_rgba(255,255,255,0.08)]"
                  >
                    <p className="text-lg text-foreground">{category.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {categoryCounts[category._id] || 0} links
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="liquid-glass animate-fade-rise-delay-2 rounded-4xl p-6 sm:p-8">
            <h2 className="text-2xl" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Recent Links
            </h2>

            {isLoading ? (
              <p className="mt-6 text-sm text-muted-foreground">Loading links...</p>
            ) : recentLinks.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                No recent links yet. Add one from a category in Library.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10">
                {recentLinks.map((link) => (
                  <li key={link._id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/5"
                    >
                      <img
                        src={faviconFromUrl(link.url)}
                        alt=""
                        className="size-5 rounded-sm"
                      />
                      <span className="text-sm text-foreground">{link.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </SiteShell>
  )
}

function HomePage() {
  return (
    <>
      <SignedOut>
        <HomeHero />
      </SignedOut>

      <SignedIn>
        <HomeDashboard />
      </SignedIn>
    </>
  )
}

function LibraryPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [categories, setCategories] = useState<VaultCategory[]>([])
  const [websites, setWebsites] = useState<VaultWebsite[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const categoryCounts = useMemo(() => {
    return websites.reduce<Record<string, number>>((acc, link) => {
      acc[link.categoryId] = (acc[link.categoryId] || 0) + 1
      return acc
    }, {})
  }, [websites])

  const loadLibraryData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const token = await getRequiredToken(getToken)
      const [nextCategories, nextWebsites] = await Promise.all([
        listCategories(token),
        listWebsites(token, { limit: 200 }),
      ])

      setCategories(nextCategories)
      setWebsites(nextWebsites)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadLibraryData()
  }, [loadLibraryData])

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = newCategoryName.trim()

    if (!name) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const token = await getRequiredToken(getToken)
      const category = await createCategory(token, { name })

      setNewCategoryName('')
      setShowCategoryForm(false)
      await loadLibraryData()
      navigate(`/library/${category._id}`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SiteShell>
      <main className="relative z-10 flex flex-1 px-6 pt-28 pb-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <header className="liquid-glass animate-fade-rise rounded-4xl px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                  Library
                </p>
                <h1
                  className="mt-2 text-4xl font-normal tracking-[-1.4px]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Library
                </h1>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCategoryForm((current) => !current)}
                className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:bg-transparent"
              >
                + New Category
              </Button>
            </div>

            {showCategoryForm ? (
              <form
                className="mt-5 flex flex-col gap-3 sm:flex-row"
                onSubmit={handleCreateCategory}
              >
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Category name"
                  className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                />

                <Button
                  type="submit"
                  variant="ghost"
                  disabled={isSaving || !newCategoryName.trim()}
                  className="rounded-full border border-white/20 px-6 py-2.5 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  Create
                </Button>
              </form>
            ) : null}
          </header>

          <section className="liquid-glass animate-fade-rise-delay rounded-4xl p-6 sm:p-8">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Start by creating your first category.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    type="button"
                    onClick={() => navigate(`/library/${category._id}`)}
                    className="liquid-glass rounded-3xl px-5 py-5 text-left transition-all hover:scale-[1.01] hover:shadow-[0_0_24px_rgba(255,255,255,0.08)]"
                  >
                    <p className="text-xl text-foreground">{category.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {categoryCounts[category._id] || 0} links
                    </p>
                  </button>
                ))}
              </div>
            )}

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </SiteShell>
  )
}

function CategoryViewPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { categoryId = '' } = useParams()

  const [category, setCategory] = useState<VaultCategory | null>(null)
  const [links, setLinks] = useState<VaultWebsite[]>([])
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadCategoryData = useCallback(async () => {
    if (!categoryId) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const token = await getRequiredToken(getToken)
      const allCategories = await listCategories(token)
      const currentCategory = allCategories.find((item) => item._id === categoryId) || null

      setCategory(currentCategory)

      if (!currentCategory) {
        setLinks([])
        return
      }

      const categoryLinks = await listWebsites(token, {
        categoryId,
        limit: 200,
      })

      setLinks(categoryLinks)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [categoryId, getToken])

  useEffect(() => {
    void loadCategoryData()
  }, [loadCategoryData])

  async function handleAddLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const url = newUrl.trim()

    if (!url || !categoryId) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const token = await getRequiredToken(getToken)

      await createWebsite(token, {
        categoryId,
        url,
        title: newTitle.trim() || undefined,
      })

      setNewUrl('')
      setNewTitle('')
      setShowLinkForm(false)
      await loadCategoryData()
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SiteShell>
      <main className="relative z-10 flex flex-1 px-6 pt-28 pb-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <header className="liquid-glass animate-fade-rise rounded-4xl px-6 py-7 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => navigate('/library')}
                  className="text-xs tracking-[0.28em] text-muted-foreground uppercase transition-colors hover:text-foreground"
                >
                  Back to Library
                </button>

                <h1
                  className="mt-2 text-4xl font-normal tracking-[-1.4px]"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  {category ? category.name : 'Category'}
                </h1>
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowLinkForm((current) => !current)}
                className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:bg-transparent"
              >
                + Add Link
              </Button>
            </div>

            {showLinkForm ? (
              <form className="mt-5 space-y-3" onSubmit={handleAddLink}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={newUrl}
                    onChange={(event) => setNewUrl(event.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                  />

                  <input
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    placeholder="Optional title"
                    className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                  />
                </div>

                <Button
                  type="submit"
                  variant="ghost"
                  disabled={isSaving || !newUrl.trim()}
                  className="rounded-full border border-white/20 px-6 py-2.5 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  Save Link
                </Button>
              </form>
            ) : null}
          </header>

          <section className="liquid-glass animate-fade-rise-delay rounded-4xl p-6 sm:p-8">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading links...</p>
            ) : !category ? (
              <p className="text-sm text-muted-foreground">
                Category not found. Return to Library and choose another.
              </p>
            ) : links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No links yet. Add your first one.
              </p>
            ) : (
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link._id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-white/5"
                    >
                      <img
                        src={faviconFromUrl(link.url)}
                        alt=""
                        className="size-5 rounded-sm"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{link.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {hostFromUrl(link.url)}
                        </p>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {errorMessage}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </SiteShell>
  )
}

function MePage() {
  const { user } = useUser()
  const [calmMode, setCalmMode] = useState(() => {
    if (typeof window === 'undefined') {
      return true
    }

    const stored = window.localStorage.getItem('vaultic-calm-mode')
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('vaultic-calm-mode', String(calmMode))
  }, [calmMode])

  return (
    <SiteShell>
      <main className="relative z-10 flex flex-1 px-6 pt-28 pb-16 sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <header className="animate-fade-rise text-center">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Profile
            </p>
            <h1
              className="mt-2 text-4xl font-normal tracking-[-1.4px]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Me
            </h1>
          </header>

          <section className="liquid-glass animate-fade-rise-delay rounded-4xl p-6 sm:p-8">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg text-foreground">
                {user?.fullName || user?.firstName || 'Vaultic Member'}
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg text-foreground">
                {user?.primaryEmailAddress?.emailAddress || 'No email available'}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Theme preference</p>
                <p className="text-sm text-foreground">Cinematic calm mode</p>
              </div>

              <button
                type="button"
                onClick={() => setCalmMode((current) => !current)}
                className={cn(
                  'rounded-full border px-5 py-2 text-sm transition-colors',
                  calmMode
                    ? 'border-white/35 text-foreground'
                    : 'border-white/20 text-muted-foreground hover:text-foreground',
                )}
              >
                {calmMode ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="mt-8">
              <SignOutButton>
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full border border-white/20 px-6 py-2.5 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
                >
                  Logout
                </Button>
              </SignOutButton>
            </div>
          </section>
        </div>
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
        </div>
      </main>
    </SiteShell>
  )
}

function ProtectedRoute({
  children,
  redirectUrl,
}: {
  children: ReactNode
  redirectUrl: string
}) {
  return (
    <>
      <SignedIn>{children}</SignedIn>

      <SignedOut>
        <RedirectToSignIn redirectUrl={redirectUrl} />
      </SignedOut>
    </>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/library"
        element={
          <ProtectedRoute redirectUrl="/library">
            <LibraryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/library/:categoryId"
        element={
          <ProtectedRoute redirectUrl="/library">
            <CategoryViewPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/me"
        element={
          <ProtectedRoute redirectUrl="/me">
            <MePage />
          </ProtectedRoute>
        }
      />

      <Route path="/vault" element={<Navigate to="/library" replace />} />
      <Route path="/sign-in/*" element={<AuthPage mode="sign-in" />} />
      <Route path="/sign-up/*" element={<AuthPage mode="sign-up" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
