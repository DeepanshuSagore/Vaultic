import { useAuth } from '@clerk/clerk-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { LayoutShell } from '@/components/layout-shell'
import { BentoCard } from '@/components/ui/bento-card'
import {
  StaggeredContainer,
  StaggeredItem,
} from '@/components/ui/staggered-container'
import {
  listCategories,
  listWebsites,
  type VaultCategory,
  type VaultWebsite,
} from '@/lib/vault-api'

async function getRequiredToken(getToken: () => Promise<string | null>) {
  const token = await getToken()
  if (!token) throw new Error('Session expired.')
  return token
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()

  const [categories, setCategories] = useState<VaultCategory[]>([])
  const [websites, setWebsites] = useState<VaultWebsite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const categoryCounts = useMemo(() => {
    return websites.reduce<Record<string, number>>((acc, w) => {
      acc[w.categoryId] = (acc[w.categoryId] || 0) + 1
      return acc
    }, {})
  }, [websites])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const token = await getRequiredToken(getToken)
      const [cats, webs] = await Promise.all([
        listCategories(token),
        listWebsites(token, { limit: 200 }),
      ])
      setCategories(cats)
      setWebsites(webs)
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load data',
      )
    } finally {
      setIsLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const totalLinks = websites.length

  return (
    <LayoutShell showSidebar>
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <StaggeredContainer className="mb-10">
          <StaggeredItem>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Dashboard
            </p>
          </StaggeredItem>
          <StaggeredItem>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Your Vault
            </h1>
          </StaggeredItem>
          <StaggeredItem>
            <p className="mt-3 font-mono text-sm tracking-wide text-muted-foreground/60">
              {isLoading ? '...' : `${categories.length} categories · ${totalLinks} artifacts`}
            </p>
          </StaggeredItem>
        </StaggeredContainer>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Bento Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="frosted-obsidian animate-shimmer h-28 rounded-2xl bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <StaggeredContainer>
            <StaggeredItem>
              <div className="frosted-obsidian flex flex-col items-center justify-center rounded-2xl py-16 text-center">
                <p className="font-display text-lg text-muted-foreground">
                  Your vault is empty
                </p>
                <p className="mt-2 text-sm text-muted-foreground/50">
                  Create your first category using the sidebar to start curating
                </p>
              </div>
            </StaggeredItem>
          </StaggeredContainer>
        ) : (
          <StaggeredContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat, index) => (
              <StaggeredItem key={cat._id}>
                <BentoCard
                  name={cat.name}
                  linkCount={categoryCounts[cat._id] || 0}
                  span={index === 0 ? 2 : 1}
                  onClick={() => navigate(`/library/${cat._id}`)}
                />
              </StaggeredItem>
            ))}
          </StaggeredContainer>
        )}
      </div>
    </LayoutShell>
  )
}
