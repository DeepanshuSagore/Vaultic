import {
  UserButton,
  useAuth,
} from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'

import { AmbientVault } from '@/components/ambient-vault'
import { MotionButton } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  createCategory,
  listCategories,
  listWebsites,
  type VaultCategory,
  type VaultWebsite,
} from '@/lib/vault-api'

/* ─── Shared data context (eliminates double-fetching) ─── */
interface VaultDataContextValue {
  categories: VaultCategory[]
  websites: VaultWebsite[]
  categoryCounts: Record<string, number>
  isLoading: boolean
  reload: () => Promise<void>
}

const VaultDataContext = createContext<VaultDataContextValue>({
  categories: [],
  websites: [],
  categoryCounts: {},
  isLoading: true,
  reload: async () => {},
})

export function useVaultData() {
  return useContext(VaultDataContext)
}

async function getRequiredToken(getToken: () => Promise<string | null>) {
  const token = await getToken()
  if (!token) throw new Error('Session expired. Please sign in again.')
  return token
}

const navLinks = [
  { to: '/library', label: 'Library', end: true },
  { to: '/me', label: 'Profile', end: false },
]

/* ─── Authenticated Layout Route (renders <Outlet />) ─── */
export function AuthenticatedLayout() {
  const { getToken } = useAuth()

  const [categories, setCategories] = useState<VaultCategory[]>([])
  const [websites, setWebsites] = useState<VaultWebsite[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const categoryCounts = useMemo(() => {
    return websites.reduce<Record<string, number>>((acc, w) => {
      acc[w.categoryId] = (acc[w.categoryId] || 0) + 1
      return acc
    }, {})
  }, [websites])

  const reload = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = await getRequiredToken(getToken)
      const [cats, webs] = await Promise.all([
        listCategories(token),
        listWebsites(token, { limit: 200 }),
      ])
      setCategories(cats)
      setWebsites(webs)
    } catch {
      /* silently fail */
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const contextValue = useMemo(
    () => ({ categories, websites, categoryCounts, isLoading, reload }),
    [categories, websites, categoryCounts, isLoading, reload],
  )

  return (
    <VaultDataContext.Provider value={contextValue}>
      <div className="relative min-h-screen overflow-hidden bg-[#050505] text-foreground">
        <AmbientVault className="opacity-60" />

        <div className="relative z-10 flex min-h-screen flex-col">
          <TopBar />

          <div className="flex flex-1">
            <CategorySidebar />
            <main className="flex-1 overflow-y-auto px-4 pb-16 pt-6 sm:px-8 lg:px-12">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </VaultDataContext.Provider>
  )
}

/* ─── Minimal public shell (no sidebar, no auth nav) ─── */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-foreground">
      <AmbientVault className="opacity-70" />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}

/* ─── Top Bar ─── */
function TopBar() {
  return (
    <nav className="relative z-20 mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 sm:px-8">
      {/* Logo */}
      <Link
        to="/"
        className="group flex items-baseline gap-0.5 transition-opacity hover:opacity-80"
      >
        <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Vaultic
        </span>
        <span className="text-[10px] font-medium tracking-wider text-accent">®</span>
      </Link>

      {/* Nav links */}
      <ul className="hidden items-center gap-1 md:flex">
        {navLinks.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-4 py-2 text-[13px] font-medium tracking-wide transition-all duration-300',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-x-2 -bottom-0.5 h-[1.5px] bg-gradient-to-r from-transparent via-accent to-transparent"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="frosted-obsidian rounded-full p-1">
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  )
}

/* ─── Category Sidebar ─── */
function CategorySidebar() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { categoryRef } = useParams()
  const { categories, categoryCounts, isLoading, reload } = useVaultData()

  const [collapsed, setCollapsed] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return

    setIsSaving(true)
    try {
      const token = await getRequiredToken(getToken)
      const cat = await createCategory(token, { name })
      setNewName('')
      setShowForm(false)
      await reload()
      navigate(`/library/${cat._id}`)
    } catch {
      /* ignore */
    } finally {
      setIsSaving(false)
    }
  }

  function isActive(cat: VaultCategory) {
    if (!categoryRef) return false
    return cat._id === categoryRef || toCategorySlug(cat.name) === decodeURIComponent(categoryRef).toLowerCase()
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="relative z-10 hidden flex-shrink-0 border-r border-border-subtle/50 lg:block"
    >
      <div className="sticky top-0 flex h-[calc(100vh-72px)] flex-col py-4">
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-surface text-muted-foreground transition-colors hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-1 flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                Categories
              </p>
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-accent"
              >
                {showForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </button>
            </div>

            {/* New category form */}
            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                  onSubmit={handleCreate}
                  className="overflow-hidden px-4 pb-3"
                >
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Category name"
                    autoFocus
                    className="w-full rounded-lg border border-border-subtle bg-transparent px-3 py-1.5 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground/40 focus:border-accent/30"
                  />
                  <MotionButton
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={isSaving || !newName.trim()}
                    className="mt-1.5 w-full text-[11px]"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create'}
                  </MotionButton>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Category list */}
            <div className="flex-1 overflow-y-auto px-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : categories.length === 0 ? (
                <p className="px-2 py-4 text-center text-[11px] text-muted-foreground/60">
                  No categories yet
                </p>
              ) : (
                <div className="space-y-0.5">
                  {categories.map((cat) => {
                    const active = isActive(cat)

                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => navigate(`/library/${cat._id}`)}
                        className={cn(
                          'group relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-all duration-200',
                          active
                            ? 'bg-white/[0.04] text-foreground'
                            : 'text-muted-foreground hover:bg-white/[0.02] hover:text-foreground',
                        )}
                      >
                        {/* Active indicator */}
                        <AnimatePresence>
                          {active && (
                            <motion.div
                              layoutId="sidebar-indicator"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 24 }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                              className="absolute left-0 top-1/2 w-[2px] -translate-y-1/2 rounded-full bg-accent"
                            />
                          )}
                        </AnimatePresence>

                        <span className="truncate text-[13px]">{cat.name}</span>
                        <span className="ml-auto font-mono text-[10px] tracking-wider text-muted-foreground/50">
                          {categoryCounts[cat._id] || 0}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  )
}

function toCategorySlug(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return slug || 'category'
}
