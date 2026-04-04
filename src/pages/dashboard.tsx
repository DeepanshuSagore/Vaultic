import { useAuth } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useVaultData } from '@/components/layout-shell'
import { BentoCard } from '@/components/ui/bento-card'
import {
  StaggeredContainer,
  StaggeredItem,
} from '@/components/ui/staggered-container'
import {
  deleteCategory,
  updateCategory,
  type VaultCategory,
} from '@/lib/vault-api'

async function getRequiredToken(getToken: () => Promise<string | null>) {
  const token = await getToken()
  if (!token) throw new Error('Session expired.')
  return token
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { categories, categoryCounts, isLoading, reload } = useVaultData()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const totalLinks = Object.values(categoryCounts).reduce((a, b) => a + b, 0)

  function startEdit(cat: VaultCategory) {
    setEditingId(cat._id)
    setEditName(cat.name)
    setDeletingId(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
  }

  async function handleRename(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingId || !editName.trim()) return

    setIsBusy(true)
    setErrorMessage(null)
    try {
      const token = await getRequiredToken(getToken)
      await updateCategory(token, editingId, { name: editName.trim() })
      setEditingId(null)
      setEditName('')
      await reload()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to rename')
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDelete(catId: string) {
    setIsBusy(true)
    setErrorMessage(null)
    try {
      const token = await getRequiredToken(getToken)
      await deleteCategory(token, catId)
      setDeletingId(null)
      await reload()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <StaggeredContainer className="mb-10">
        <StaggeredItem>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Library
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
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="group/card relative">
                {/* Edit/Delete toolbar — appears on hover */}
                <div className="absolute right-3 top-3 z-20 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover/card:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startEdit(cat) }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                    title="Rename"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeletingId(cat._id); setEditingId(null) }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Inline rename form */}
                {editingId === cat._id ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="frosted-obsidian rounded-2xl p-5"
                  >
                    <form onSubmit={handleRename} className="flex flex-col gap-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        autoFocus
                        className="w-full rounded-lg border border-border-subtle bg-transparent px-3 py-2 font-display text-lg text-foreground outline-none focus:border-accent/30"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isBusy || !editName.trim()}
                          className="flex h-8 items-center gap-1.5 rounded-lg bg-accent/10 px-3 text-xs font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40"
                        >
                          {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : deletingId === cat._id ? (
                  /* Delete confirmation */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="frosted-obsidian rounded-2xl p-5"
                  >
                    <p className="text-sm text-foreground">
                      Delete <strong className="text-accent">{cat.name}</strong>?
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      This will also delete {categoryCounts[cat._id] || 0} links inside it.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(cat._id)}
                        disabled={isBusy}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500/10 px-3 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-40"
                      >
                        {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(null)}
                        className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* Normal card */
                  <BentoCard
                    name={cat.name}
                    linkCount={categoryCounts[cat._id] || 0}
                    span={index === 0 && categories.length > 2 ? 2 : 1}
                    onClick={() => navigate(`/library/${cat._id}`)}
                  />
                )}
              </div>
            </StaggeredItem>
          ))}
        </StaggeredContainer>
      )}
    </div>
  )
}
