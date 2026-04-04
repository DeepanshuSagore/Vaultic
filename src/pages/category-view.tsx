import { useAuth } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { LayoutShell } from '@/components/layout-shell'
import { ArtifactCard } from '@/components/ui/artifact-card'
import { MotionButton } from '@/components/ui/button'
import {
  StaggeredContainer,
  StaggeredItem,
} from '@/components/ui/staggered-container'
import {
  createWebsite,
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

function toCategorySlug(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return slug || 'category'
}

export function CategoryViewPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { categoryRef = '' } = useParams()

  const [category, setCategory] = useState<VaultCategory | null>(null)
  const [links, setLinks] = useState<VaultWebsite[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!categoryRef) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const token = await getRequiredToken(getToken)
      const allCategories = await listCategories(token)
      const decodedRef = decodeURIComponent(categoryRef).toLowerCase()
      const currentCategory =
        allCategories.find(
          (item) =>
            item._id === categoryRef || toCategorySlug(item.name) === decodedRef,
        ) || null

      setCategory(currentCategory)

      if (!currentCategory) {
        setLinks([])
        return
      }

      const categoryLinks = await listWebsites(token, {
        categoryId: currentCategory._id,
        limit: 200,
      })

      setLinks(categoryLinks)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }, [categoryRef, getToken])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function handleAddLink(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const url = newUrl.trim()
    if (!url || !category?._id) return

    setIsSaving(true)
    setErrorMessage(null)

    try {
      const token = await getRequiredToken(getToken)
      await createWebsite(token, {
        categoryId: category._id,
        url,
        title: newTitle.trim() || undefined,
      })
      setNewUrl('')
      setNewTitle('')
      setShowForm(false)
      await loadData()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <LayoutShell showSidebar>
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <StaggeredContainer className="mb-8">
          <StaggeredItem>
            <button
              type="button"
              onClick={() => navigate('/library')}
              className="group flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-0.5" />
              Library
            </button>
          </StaggeredItem>

          <StaggeredItem>
            <div className="mt-3 flex items-center justify-between">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {category ? category.name : 'Category'}
              </h1>

              <MotionButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(!showForm)}
              >
                {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{showForm ? 'Cancel' : 'Add Link'}</span>
              </MotionButton>
            </div>
          </StaggeredItem>

          <StaggeredItem>
            <p className="mt-1 font-mono text-xs tracking-wide text-muted-foreground/50">
              {isLoading ? '...' : `${links.length} artifacts`}
            </p>
          </StaggeredItem>
        </StaggeredContainer>

        {/* Add Link Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              onSubmit={handleAddLink}
              className="mb-6 overflow-hidden"
            >
              <div className="frosted-obsidian rounded-2xl p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-xl border border-border-subtle bg-transparent px-4 py-2.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-accent/30"
                  />
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Optional title"
                    className="w-full rounded-xl border border-border-subtle bg-transparent px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-accent/30"
                  />
                </div>
                <MotionButton
                  type="submit"
                  variant="accent"
                  size="sm"
                  disabled={isSaving || !newUrl.trim()}
                  className="mt-3"
                >
                  {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Artifact'}
                </MotionButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {/* Link List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="frosted-obsidian animate-shimmer h-16 rounded-2xl bg-gradient-to-r from-transparent via-white/[0.02] to-transparent"
              />
            ))}
          </div>
        ) : !category ? (
          <div className="frosted-obsidian rounded-2xl py-16 text-center">
            <p className="text-sm text-muted-foreground">Category not found</p>
          </div>
        ) : links.length === 0 ? (
          <div className="frosted-obsidian rounded-2xl py-16 text-center">
            <p className="font-display text-lg text-muted-foreground">No artifacts yet</p>
            <p className="mt-2 text-sm text-muted-foreground/50">
              Add your first link to start curating
            </p>
          </div>
        ) : (
          <StaggeredContainer className="space-y-2">
            {links.map((link) => (
              <StaggeredItem key={link._id}>
                <ArtifactCard url={link.url} title={link.title} />
              </StaggeredItem>
            ))}
          </StaggeredContainer>
        )}
      </div>
    </LayoutShell>
  )
}
