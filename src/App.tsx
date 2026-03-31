import {
  RedirectToSignIn,
  SignIn,
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
  deleteCategory,
  deleteWebsite,
  listCategories,
  listWebsites,
  moveWebsite,
  searchWebsites,
  updateWebsite,
  type VaultCategory,
  type VaultWebsite,
} from '@/lib/vault-api'
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

function formatHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

function toTagArray(rawTags: string) {
  return [...new Set(rawTags.split(',').map((tag) => tag.trim()).filter(Boolean))]
    .slice(0, 20)
}

function getErrorMessage(error: unknown) {
  if (error instanceof VaultApiError || error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please try again.'
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
            Vaultic<sup className="text-xs">&reg;</sup>
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
  const { getToken } = useAuth()
  const { user } = useUser()

  const [categories, setCategories] = useState<VaultCategory[]>([])
  const [websites, setWebsites] = useState<VaultWebsite[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newWebsite, setNewWebsite] = useState({
    categoryId: '',
    url: '',
    title: '',
    notes: '',
    tags: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const categoriesById = useMemo(() => {
    return categories.reduce<Record<string, VaultCategory>>((acc, category) => {
      acc[category._id] = category
      return acc
    }, {})
  }, [categories])

  const getAccessToken = useCallback(async () => {
    const token = await getToken()

    if (!token) {
      throw new Error('Session expired. Please sign in again.')
    }

    return token
  }, [getToken])

  const syncNewWebsiteCategory = useCallback(
    (nextCategories: VaultCategory[], activeCategoryId: string) => {
      setNewWebsite((current) => {
        if (nextCategories.length === 0) {
          if (!current.categoryId) {
            return current
          }

          return {
            ...current,
            categoryId: '',
          }
        }

        const categoryId =
          current.categoryId &&
          nextCategories.some((category) => category._id === current.categoryId)
            ? current.categoryId
            : activeCategoryId !== 'all' &&
                nextCategories.some((category) => category._id === activeCategoryId)
              ? activeCategoryId
              : nextCategories[0]._id

        if (categoryId === current.categoryId) {
          return current
        }

        return {
          ...current,
          categoryId,
        }
      })
    },
    [],
  )

  const loadVaultData = useCallback(
    async (
      overrides?: {
        categoryId?: string
        search?: string
      },
      showLoader = true,
    ) => {
      const activeCategoryId = overrides?.categoryId ?? selectedCategoryId
      const activeSearch = overrides?.search ?? searchQuery

      if (showLoader) {
        setIsLoading(true)
      }

      setErrorMessage(null)

      try {
        const token = await getAccessToken()
        const nextCategories = await listCategories(token)

        setCategories(nextCategories)
        syncNewWebsiteCategory(nextCategories, activeCategoryId)

        if (activeSearch.length >= 2) {
          const searchResults = await searchWebsites(token, activeSearch)
          const filteredResults =
            activeCategoryId === 'all'
              ? searchResults
              : searchResults.filter(
                  (website) => website.categoryId === activeCategoryId,
                )

          setWebsites(filteredResults)
        } else {
          const listedWebsites = await listWebsites(
            token,
            activeCategoryId === 'all'
              ? {}
              : {
                  categoryId: activeCategoryId,
                },
          )

          setWebsites(listedWebsites)
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error))
      } finally {
        if (showLoader) {
          setIsLoading(false)
        }
      }
    },
    [getAccessToken, searchQuery, selectedCategoryId, syncNewWebsiteCategory],
  )

  useEffect(() => {
    void loadVaultData()
  }, [loadVaultData])

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = newCategoryName.trim()

    if (!name) {
      return
    }

    setIsMutating(true)
    setErrorMessage(null)

    try {
      const token = await getAccessToken()
      const category = await createCategory(token, { name })

      setNewCategoryName('')
      setSelectedCategoryId(category._id)
      setSearchInput('')
      setSearchQuery('')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsMutating(false)
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (!window.confirm('Delete this category and all websites inside it?')) {
      return
    }

    setIsMutating(true)
    setErrorMessage(null)

    try {
      const token = await getAccessToken()

      await deleteCategory(token, categoryId)

      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId('all')
      } else {
        await loadVaultData(undefined, false)
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsMutating(false)
    }
  }

  async function handleCreateWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const url = newWebsite.url.trim()

    if (!newWebsite.categoryId) {
      setErrorMessage('Create a category first, then save your website.')
      return
    }

    if (!url) {
      return
    }

    setIsMutating(true)
    setErrorMessage(null)

    try {
      const token = await getAccessToken()

      await createWebsite(token, {
        categoryId: newWebsite.categoryId,
        url,
        title: newWebsite.title.trim() || undefined,
        notes: newWebsite.notes.trim() || undefined,
        tags: toTagArray(newWebsite.tags),
      })

      setNewWebsite((current) => ({
        ...current,
        url: '',
        title: '',
        notes: '',
        tags: '',
      }))

      await loadVaultData(undefined, false)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsMutating(false)
    }
  }

  async function handleMoveWebsite(websiteId: string, categoryId: string) {
    setIsMutating(true)
    setErrorMessage(null)

    try {
      const token = await getAccessToken()

      await moveWebsite(token, websiteId, categoryId)
      await loadVaultData(undefined, false)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsMutating(false)
    }
  }

  async function handleToggleFavorite(website: VaultWebsite) {
    setIsMutating(true)
    setErrorMessage(null)

    try {
      const token = await getAccessToken()

      await updateWebsite(token, website._id, {
        isFavorite: !website.isFavorite,
      })

      await loadVaultData(undefined, false)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsMutating(false)
    }
  }

  async function handleDeleteWebsite(websiteId: string) {
    if (!window.confirm('Delete this saved website?')) {
      return
    }

    setIsMutating(true)
    setErrorMessage(null)

    try {
      const token = await getAccessToken()

      await deleteWebsite(token, websiteId)
      await loadVaultData(undefined, false)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsMutating(false)
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchQuery(searchInput.trim())
  }

  function handleClearSearch() {
    setSearchInput('')
    setSearchQuery('')
  }

  const activeCategoryName =
    selectedCategoryId === 'all'
      ? 'all categories'
      : categoriesById[selectedCategoryId]?.name || 'category'

  const websiteSummary = `${websites.length} saved link${
    websites.length === 1 ? '' : 's'
  } in ${activeCategoryName}`

  return (
    <SiteShell>
      <main className="relative z-10 flex-1 px-4 pt-28 pb-12 sm:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <header className="liquid-glass rounded-4xl px-6 py-8 sm:px-10">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Vaultic Workspace
            </p>
            <h1
              className="mt-3 text-4xl font-normal leading-[0.95] tracking-[-1.8px] sm:text-6xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Build your private index.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {user?.firstName
                ? `Welcome back, ${user.firstName}.`
                : 'Welcome back.'}{' '}
              Shape categories, collect links, and keep your web research
              beautifully organized.
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="liquid-glass rounded-4xl p-5 sm:p-6">
              <h2 className="text-lg text-foreground">Categories</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Organize links by purpose.
              </p>

              <form className="mt-4 space-y-3" onSubmit={handleCreateCategory}>
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="Design inspiration"
                  className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                />

                <Button
                  type="submit"
                  variant="ghost"
                  disabled={isMutating || !newCategoryName.trim()}
                  className="liquid-glass w-full rounded-full px-5 py-2.5 text-sm text-foreground hover:bg-transparent"
                >
                  Add Category
                </Button>
              </form>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={cn(
                    'flex w-full items-center justify-between rounded-2xl border px-4 py-2.5 text-left text-sm transition-colors',
                    selectedCategoryId === 'all'
                      ? 'border-white/35 bg-white/8 text-foreground'
                      : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground',
                  )}
                >
                  <span>All categories</span>
                </button>

                {categories.map((category) => {
                  const isSelected = selectedCategoryId === category._id

                  return (
                    <div className="flex items-center gap-2" key={category._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryId(category._id)}
                        className={cn(
                          'flex flex-1 items-center justify-between rounded-2xl border px-4 py-2.5 text-left text-sm transition-colors',
                          isSelected
                            ? 'border-white/35 bg-white/8 text-foreground'
                            : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground',
                        )}
                      >
                        <span>{category.name}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(category._id)}
                        disabled={isMutating}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-white/25 hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            </aside>

            <section className="space-y-6">
              <div className="liquid-glass rounded-4xl p-5 sm:p-6">
                <h2 className="text-lg text-foreground">Capture Website</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Save links with notes and tags for quick retrieval.
                </p>

                <form className="mt-4 space-y-3" onSubmit={handleCreateWebsite}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <select
                      value={newWebsite.categoryId}
                      onChange={(event) =>
                        setNewWebsite((current) => ({
                          ...current,
                          categoryId: event.target.value,
                        }))
                      }
                      disabled={categories.length === 0}
                      className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45 disabled:opacity-50"
                    >
                      {categories.length === 0 ? (
                        <option value="">Create a category first</option>
                      ) : null}

                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>

                    <input
                      value={newWebsite.url}
                      onChange={(event) =>
                        setNewWebsite((current) => ({
                          ...current,
                          url: event.target.value,
                        }))
                      }
                      placeholder="https://example.com"
                      className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      value={newWebsite.title}
                      onChange={(event) =>
                        setNewWebsite((current) => ({
                          ...current,
                          title: event.target.value,
                        }))
                      }
                      placeholder="Optional title"
                      className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                    />

                    <input
                      value={newWebsite.tags}
                      onChange={(event) =>
                        setNewWebsite((current) => ({
                          ...current,
                          tags: event.target.value,
                        }))
                      }
                      placeholder="tags, comma, separated"
                      className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                    />
                  </div>

                  <textarea
                    value={newWebsite.notes}
                    onChange={(event) =>
                      setNewWebsite((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Add a short note for future context"
                    className="w-full resize-none rounded-3xl border border-white/20 bg-transparent px-4 py-3 text-sm text-foreground outline-none focus:border-white/45"
                  />

                  <Button
                    type="submit"
                    variant="ghost"
                    disabled={isMutating || categories.length === 0}
                    className="liquid-glass rounded-full px-7 py-2.5 text-sm text-foreground hover:bg-transparent"
                  >
                    Save Website
                  </Button>
                </form>
              </div>

              <div className="liquid-glass rounded-4xl p-5 sm:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h2 className="text-lg text-foreground">Saved Links</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {websiteSummary}
                      {searchQuery ? ` matching "${searchQuery}"` : ''}
                    </p>
                  </div>

                  <form
                    className="flex w-full flex-col gap-2 sm:flex-row xl:max-w-xl"
                    onSubmit={handleSearchSubmit}
                  >
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Search title, notes, tags"
                      className="w-full rounded-full border border-white/20 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none focus:border-white/45"
                    />

                    <Button
                      type="submit"
                      variant="ghost"
                      className="liquid-glass rounded-full px-6 py-2.5 text-sm text-foreground hover:bg-transparent"
                    >
                      Search
                    </Button>

                    {searchQuery ? (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClearSearch}
                        className="rounded-full border border-white/20 px-6 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    ) : null}
                  </form>
                </div>

                {errorMessage ? (
                  <p className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {errorMessage}
                  </p>
                ) : null}

                {isLoading ? (
                  <p className="mt-6 text-sm text-muted-foreground">
                    Loading your vault...
                  </p>
                ) : websites.length === 0 ? (
                  <p className="mt-6 rounded-3xl border border-white/10 px-4 py-5 text-sm text-muted-foreground">
                    No websites yet for this view. Save your first link to bring
                    this vault to life.
                  </p>
                ) : (
                  <div className="mt-6 space-y-3">
                    {websites.map((website) => (
                      <article
                        key={website._id}
                        className="rounded-3xl border border-white/15 bg-black/20 px-4 py-4 backdrop-blur-sm"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg text-foreground">
                                {website.title}
                              </h3>

                              {website.isFavorite ? (
                                <span className="rounded-full border border-amber-300/40 bg-amber-300/15 px-2 py-0.5 text-xs text-amber-200">
                                  Favorite
                                </span>
                              ) : null}
                            </div>

                            <a
                              href={website.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-sm text-muted-foreground hover:text-foreground"
                            >
                              {formatHost(website.url)}
                            </a>

                            {website.notes ? (
                              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                                {website.notes}
                              </p>
                            ) : null}

                            {website.tags.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {website.tags.map((tag) => (
                                  <span
                                    key={`${website._id}-${tag}`}
                                    className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-muted-foreground"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="flex w-full flex-col gap-2 lg:w-56">
                            <select
                              value={website.categoryId}
                              onChange={(event) =>
                                void handleMoveWebsite(
                                  website._id,
                                  event.target.value,
                                )
                              }
                              disabled={isMutating}
                              className="w-full rounded-full border border-white/20 bg-transparent px-3 py-2 text-sm text-foreground outline-none focus:border-white/45"
                            >
                              {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>

                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => void handleToggleFavorite(website)}
                              disabled={isMutating}
                              className="rounded-full border border-white/20 px-5 py-2 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
                            >
                              {website.isFavorite
                                ? 'Remove Favorite'
                                : 'Mark Favorite'}
                            </Button>

                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => void handleDeleteWebsite(website._id)}
                              disabled={isMutating}
                              className="rounded-full border border-white/20 px-5 py-2 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
                            >
                              Delete
                            </Button>

                            <p className="text-right text-xs text-muted-foreground">
                              Updated{' '}
                              {new Date(website.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
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
