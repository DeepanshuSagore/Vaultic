const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000').replace(/\/$/, '')

export interface VaultCategory {
  _id: string
  userId: string
  name: string
  color: string
  icon: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface VaultWebsite {
  _id: string
  userId: string
  categoryId: string
  url: string
  normalizedUrl: string
  title: string
  notes: string
  tags: string[]
  isFavorite: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface WebsiteListParams {
  categoryId?: string
  isArchived?: boolean
  isFavorite?: boolean
  limit?: number
}

export interface CreateCategoryPayload {
  name: string
  color?: string
  icon?: string
  sortOrder?: number
}

export interface CreateWebsitePayload {
  categoryId: string
  url: string
  title?: string
  notes?: string
  tags?: string[]
  isFavorite?: boolean
  isArchived?: boolean
}

export interface UpdateWebsitePayload {
  categoryId?: string
  url?: string
  title?: string
  notes?: string
  tags?: string[]
  isFavorite?: boolean
  isArchived?: boolean
}

interface ApiErrorPayload {
  message?: string
  details?: unknown
  issues?: Array<{ path?: string; message?: string }>
}

export class VaultApiError extends Error {
  readonly status: number
  readonly payload: ApiErrorPayload | null

  constructor(status: number, message: string, payload: ApiErrorPayload | null) {
    super(message)
    this.name = 'VaultApiError'
    this.status = status
    this.payload = payload
  }
}

async function request<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)

  headers.set('Authorization', `Bearer ${token}`)

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null

    try {
      payload = (await response.json()) as ApiErrorPayload
    } catch {
      payload = null
    }

    const message =
      payload && payload.message
        ? payload.message
        : `Request failed with status ${response.status}`

    throw new VaultApiError(response.status, message, payload)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function listCategories(token: string) {
  return request<VaultCategory[]>(token, '/api/categories')
}

export function createCategory(token: string, payload: CreateCategoryPayload) {
  return request<VaultCategory>(token, '/api/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteCategory(token: string, categoryId: string) {
  return request<void>(token, `/api/categories/${categoryId}`, {
    method: 'DELETE',
  })
}

export function listWebsites(token: string, params: WebsiteListParams = {}) {
  const query = new URLSearchParams()

  if (params.categoryId) {
    query.set('categoryId', params.categoryId)
  }

  if (typeof params.isArchived === 'boolean') {
    query.set('isArchived', String(params.isArchived))
  }

  if (typeof params.isFavorite === 'boolean') {
    query.set('isFavorite', String(params.isFavorite))
  }

  if (typeof params.limit === 'number') {
    query.set('limit', String(params.limit))
  }

  const suffix = query.size > 0 ? `?${query.toString()}` : ''

  return request<VaultWebsite[]>(token, `/api/websites${suffix}`)
}

export function searchWebsites(token: string, query: string) {
  const search = new URLSearchParams({ q: query })
  return request<VaultWebsite[]>(token, `/api/websites/search?${search.toString()}`)
}

export function createWebsite(token: string, payload: CreateWebsitePayload) {
  return request<VaultWebsite>(token, '/api/websites', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateWebsite(
  token: string,
  websiteId: string,
  payload: UpdateWebsitePayload,
) {
  return request<VaultWebsite>(token, `/api/websites/${websiteId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function moveWebsite(token: string, websiteId: string, categoryId: string) {
  return request<VaultWebsite>(token, `/api/websites/${websiteId}/move`, {
    method: 'PATCH',
    body: JSON.stringify({ categoryId }),
  })
}

export function deleteWebsite(token: string, websiteId: string) {
  return request<void>(token, `/api/websites/${websiteId}`, {
    method: 'DELETE',
  })
}
